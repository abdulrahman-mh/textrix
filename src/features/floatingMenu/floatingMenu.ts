import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { Editor } from '../../Editor';
import type { Menuitem } from '../../Feature';
import { uploadImages } from '../media/uploadImages';

export class FloatingMenu {
  private menu: HTMLElement;
  private keepScaled = false;
  private updateLock = false;
  private fileUploadInput: HTMLInputElement;
  private boundHandlers: Record<string, EventListener> = {};
  private menuitems: Record<string, Menuitem>;
  private validNodes = ['paragraph', 'h3', 'h4'];

  constructor(
    private editor: Editor,
    private editorView: EditorView,
    menuitems: Menuitem[],
  ) {
    this.menuitems = Object.fromEntries(menuitems.map((item) => [item.name, item]));

    const menu = document.createElement('div');
    menu.className = 'floatingMenu';
    this.menu = menu;

    const menuItems = document.createElement('div');
    menuItems.className = 'floatingMenu-menu';
    menu.appendChild(menuItems);

    for (const item of menuitems) {
      if (item.name === 'floatingMenu') {
        menu.prepend(this.createMenuItem(item));
      } else {
        menuItems.appendChild(this.createMenuItem(item));
      }
    }

    this.editorView.dom.parentNode?.appendChild(this.menu);
    const fileUploadInput = document.createElement('input');
    fileUploadInput.type = 'file';
    fileUploadInput.accept = 'image/*';
    fileUploadInput.multiple = true;
    fileUploadInput.style.display = 'none';

    this.fileUploadInput = fileUploadInput;
    this.editorView.dom.parentNode?.appendChild(this.fileUploadInput);

    fileUploadInput.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        uploadImages({ editor, files: input.files, view: this.editorView });
      }
    });

    this.boundHandlers = {
      mouseup: this.handleKeyup.bind(this) as any,
      keydown: ((e: KeyboardEvent) => {
        if (e.key === 'Escape') this.toggleOpen(false);
      }) as any,
      resize: this.handleResize.bind(this),
    };

    document.addEventListener('mouseup', this.boundHandlers.mouseup);
    document.addEventListener('keydown', this.boundHandlers.keydown);
    window.addEventListener('resize', this.boundHandlers.resize);

    this.update();
  }

  private handleKeyup(e: MouseEvent) {
    const target = e.target as Element;
    if (this.menu!.contains(target)) {
      const button = target.closest('button.floatingMenu-button') as HTMLButtonElement | null;
      if (!button) return;
      const { action } = button.dataset;
      if (!action) return;

      const { state, dispatch } = this.editorView;

      if (action === 'floatingMenu') {
        const status = this.toggleOpen();

        if (status) {
          this.keepScaled = true;
          dispatch(state.tr.setMeta('removePlaceholder', { pos: state.selection.from - 1 }));
        } else {
          this.editorView.dom.focus();
          dispatch(state.tr.setMeta('addPlaceholder', { pos: state.selection.from - 1 }));
        }
        return;
      }

      // this.editorView.dom.focus();

      if (action === 'image') {
        this.fileUploadInput.click();
      } else {
        if (['video', 'embed'].includes(action)) {
          this.updateLock = true;
          this.hideMenu();
        }
        this.menuitems[action]?.execute?.(state, dispatch);
      }

      this.editorView.focus();
      this.toggleOpen(false);
    } else {
      this.menu.classList.remove('is-scaled');
    }
  }

  private createMenuItem(item: Menuitem) {
    const button = document.createElement('button');
    button.setAttribute('class', 'floatingMenu-button');
    button.setAttribute('tabindex', '-1');
    button.setAttribute('title', item.title);
    button.setAttribute('aria-label', item.title);
    button.setAttribute('data-action', item.name);
    if (item.dataActionValue) button.setAttribute('data-action-value', item.dataActionValue);
    button.innerHTML = item.icon;
    return button;
  }

  private handleResize(): void {
    this.keepScaled = true;
    this.update();
  }

  private showMenu(state: EditorState) {
    this.menu.classList.add('is-active');

    // Don't remove scaled status if the updated triggered when remove the placeholder
    if (!this.keepScaled) {
      this.menu.classList.remove('is-scaled');
    }

    const coords = this.editorView.coordsAtPos(state.selection.from);
    const direction = getComputedStyle(this.editorView.dom).direction;

    this.menu.style.left = '';
    this.menu.style.right = '';

    if (direction === 'rtl') {
      this.menu.style.right = `${window.innerWidth - coords.right + window.scrollX}px`;
    } else {
      this.menu.style.left = `${coords.left + window.scrollX}px`;
    }

    const top = `${coords.top + (coords.bottom - coords.top) / 2 - 40 / 2 + window.scrollY}px`;
    this.menu.style.top = top;
  }

  private hideMenu() {
    this.menu.classList.remove('is-active', 'is-scaled');
  }

  private toggleOpen(force?: boolean) {
    const shouldScale = typeof force === 'boolean' ? force : !this.menu.classList.contains('is-scaled');
    this.menu.classList.toggle('is-scaled', shouldScale);
    return shouldScale;
  }

  /** Called by ProseMirror */
  public update() {
    if (this.updateLock) {
      this.updateLock = false;
      return;
    }

    const { state } = this.editorView;
    const { selection } = state;
    const { empty, $anchor } = selection;

    const topLevelParent = $anchor.depth > 0 ? $anchor.node(1) : null;
    const name = topLevelParent?.type?.name;

    if (empty && $anchor.parent.textContent === '' && name && this.validNodes.includes(name)) {
      this.showMenu(state);
      if (this.keepScaled) {
        this.keepScaled = false;
      }
    } else {
      this.hideMenu();
    }
  }

  /** Called by ProseMirror */
  public destroy(): void {
    document.removeEventListener('mouseup', this.boundHandlers.mouseup);
    document.removeEventListener('keydown', this.boundHandlers.keydown);
    window.removeEventListener('resize', this.boundHandlers.resize);

    this.menu?.remove();
    this.fileUploadInput?.remove();
  }
}
