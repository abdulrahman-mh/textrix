import type { EditorView } from 'prosemirror-view';
import { type EditorState, type Transaction, NodeSelection } from 'prosemirror-state';

import { isMarkActive } from '../../helpers/isMarkActive';
import unsetMark from '../../commands/unsetMark';
import setMark from '../../commands/setMark';
import type { Editor } from '../../Editor';
import type { Menuitem } from '../../Feature';
import { createElement } from '../../util/createElement';
import { sanitizeHref } from '../link/sanitizeUri';

export class BubbleMenus {
  private editor: Editor;
  private view: EditorView;
  private menuItems: Record<string, Menuitem>;
  private textTooltip: HTMLElement;
  private mediaTooltip: HTMLElement;
  private linkInputField!: HTMLInputElement;
  private updateLock = false;
  private windowHandlers: Record<string, EventListener> = {};

  constructor({ editor, view, menuitems }: { editor: Editor; view: EditorView; menuitems: Menuitem[] }) {
    this.editor = editor;
    this.view = view;
    this.menuItems = Object.fromEntries(menuitems.map((item) => [item.name, item]));

    this.textTooltip = this.createTooltip(menuitems.filter((item) => item.type === 'text'));
    this.mediaTooltip = this.createTooltip(
      menuitems.filter((item) => item.type === 'media'),
      'bubbleMenu-media',
    );

    this.view.dom.parentElement?.append(this.textTooltip, this.mediaTooltip);
    this.attachEventListeners();
  }

  private createTooltip(items: Menuitem[], extraClass = ''): HTMLElement {
    const tooltip = createElement('div', { className: `bubbleMenu ${extraClass}` });
    const inner = createElement('div', { className: 'bubbleMenu-inner' });

    const buttonSet = createElement('div', { className: 'buttonSet' });
    this.createMenuButtons(items, buttonSet);

    if (items.some((item) => item.name === 'link')) {
      const linkInput = this.createLinkInput();
      inner.append(buttonSet, linkInput);
      this.linkInputField = linkInput.querySelector('input')!;
    } else {
      inner.appendChild(buttonSet);
    }

    const arrowClip = createElement('div', { className: 'bubbleMenu-arrowClip' });
    arrowClip.appendChild(createElement('span', { className: 'bubbleMenu-arrow' }));

    tooltip.append(inner, arrowClip);
    return tooltip;
  }

  private createMenuButtons(items: Menuitem[], parent: HTMLElement): void {
    for (const item of items) {
      parent.appendChild(this.createButton(item));
      if (item.divider) {
        parent.appendChild(createElement('div', { className: 'buttonSet-separator' }));
      }
    }
  }

  private createButton(item: Menuitem): HTMLButtonElement {
    const button = createElement('button', {
      className: 'button--bubbleMenu',
      attributes: { 'data-action': item.name, title: item.title },
    });

    // Ensure item.icon is inserted as HTML
    if (item.icon) {
      button.innerHTML = item.icon;
    }

    return button;
  }

  private createLinkInput(): HTMLElement {
    const container = createElement('div', { className: 'bubbleMenu-linkinput' });
    const input = createElement('input', {
      className: 'bubbleMenu-linkinputField',
      attributes: { type: 'text', placeholder: this.editor.options.messages.linkPlaceholder },
    }) as HTMLInputElement;

    input.addEventListener('blur', () => this.handleLinkBlur());
    input.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.key === 'Enter') this.handleSetLink();
      else if (e.key === 'Escape') this.handleLinkBlur();
    });

    const cancelButton = this.createButton({
      name: 'cancelLink',
      title: '',
      icon: this.editor.options.icons.removeThin,
    });

    container.append(input, cancelButton);
    return container;
  }

  private attachEventListeners(): void {
    this.windowHandlers = {
      blur: () => this.hideTooltip(),
      focus: () => this.update(),
      visibilitychange: () => !document.hidden && this.update(),
      mousedown: this.onDocumentMouseDown.bind(this) as any,
      mouseup: this.onDocumentMouseUp.bind(this) as any,
    };

    window.addEventListener('blur', this.windowHandlers.blur);
    window.addEventListener('focus', this.windowHandlers.focus);
    document.addEventListener('visibilitychange', this.windowHandlers.visibilitychange);
    document.addEventListener('mousedown', this.windowHandlers.mousedown);
    document.addEventListener('mouseup', this.windowHandlers.mouseup);

    this.textTooltip.addEventListener('mousedown', (e) => e.preventDefault());
    this.mediaTooltip.addEventListener('mousedown', (e) => e.preventDefault());
  }

  private onDocumentMouseDown(event: MouseEvent): void {
    const target = event.target as Element;
    this.updateLock =
      this.view.dom.contains(target) || this.textTooltip.contains(target) || this.mediaTooltip.contains(target);
    if (!this.updateLock) this.hideTooltip();
  }

  private onDocumentMouseUp(event: MouseEvent): void {
    this.updateLock = false;
    const target = event.target as Element;
    if (this.textTooltip.contains(target) || this.mediaTooltip.contains(target)) this.handleTooltipClick(target);
    else this.update();
  }

  private handleTooltipClick(target: Element): void {
    const button = target.closest('button.button--bubbleMenu') as HTMLButtonElement | null;
    if (!button) return;

    const action = button.dataset.action;
    if (!action) return;

    const { state, dispatch } = this.view;
    action === 'link' ? this.handleLinkAction(state, dispatch) : this.menuItems[action]?.execute?.(state, dispatch);
    this.update();
  }

  private handleLinkAction(state: EditorState, dispatch?: (tr: Transaction) => void): void {
    if (isMarkActive(state, state.schema.marks.link, {}, false)) {
      unsetMark(state.schema.marks.link, { fullyRemoveMark: true })(state, dispatch);
    } else {
      this.updateLock = true;
      this.textTooltip.classList.add('bubbleMenu--linkMode');
      this.linkInputField.focus();
    }
  }

  private handleSetLink(): void {
    this.updateLock = false;
    const href = this.linkInputField.value.trim();
    this.linkInputField.blur();
    const sanitizedHref = sanitizeHref(href);

    if (sanitizedHref) {
      const { state, dispatch } = this.view;
      setMark(state.schema.marks.link, {
        class: 'markup--anchor markup--p-anchor',
        href: sanitizedHref,
        'data-tooltip': sanitizedHref,
        'data-tooltip-position': 'bottom',
        target: '_blank',
      })(state, dispatch);

      const selection = window.getSelection();
      if (selection) {
        const range = selection.getRangeAt(0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    this.linkInputField.value = '';
  }

  private handleLinkBlur(): void {
    this.hideTooltip();
    this.view.focus();
    this.update();
  }

  private showTooltip(tooltip: HTMLElement): void {
    const range = window.getSelection()?.getRangeAt(0);
    if (range) {
      const rect = range.getBoundingClientRect();

      tooltip.style.display = 'inline-block';
      const { top, left } = this.calculateTooltipPosition(tooltip, rect);
      tooltip.style.removeProperty('display');

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;

      // Force layout recalculation before adding the active class
      // Or we can use settimeout()
      tooltip.offsetWidth; // Trigger a reflows

      // Now apply the active class
      tooltip.classList.add('bubbleMenu--active');
    }
  }

  private updateTooltipItemsStatus(tooltip: HTMLElement) {
    const { state } = this.view;
  
    const result = tooltip.querySelectorAll('.buttonSet > button') as NodeListOf<HTMLButtonElement>;
  
    for (const button of result) {
      const action = button.dataset.action as string;
  
      const item = this.menuItems[action];
  
      const isVisible = item.isVisible?.(state) ?? true;
      button.style.display = isVisible ? '' : 'none';
  
      // Check for a divider right after this button
      const nextSibling = button.nextElementSibling as any
      if (nextSibling?.classList.contains('buttonSet-separator')) {
        nextSibling.style.display = isVisible ? '' : 'none';
      }
  
      if (isVisible) {
        const enabled = item.canActivate?.(state) ?? true;
        button.toggleAttribute('disabled', !enabled);
        button.classList.toggle('is-active', item.isActive?.(state) ?? true);
      }
    }
  }
  

  private calculateTooltipPosition(tooltip: HTMLElement, rect: DOMRect) {
    const TOOLTIP_WIDTH = tooltip.offsetWidth;

    const extraH = tooltip === this.textTooltip ? 6 : 20;
    const TOOLTIP_HEIGHT = tooltip.offsetHeight + extraH;

    const PADDING = 10;
    const windowWidth = window.innerWidth;

    const top = rect.top + window.scrollY - TOOLTIP_HEIGHT;
    let left = rect.left + window.scrollX - TOOLTIP_WIDTH / 2 + rect.width / 2;

    left = Math.max(PADDING, Math.min(left, windowWidth - TOOLTIP_WIDTH - PADDING));
    return { top, left };
  }

  // TODO: Show the menu on the center of the line, when DBL click fire
  private handleDblClick() {}

  private hideTooltip(tooltip?: HTMLElement) {
    if (tooltip) {
      tooltip.classList.remove('bubbleMenu--active', 'bubbleMenu--linkMode');
    } else {
      // Hide both
      this.textTooltip.classList.remove('bubbleMenu--active', 'bubbleMenu--linkMode');
      this.mediaTooltip.classList.remove('bubbleMenu--active');
    }
  }

  private scrollToMedia(nodeDOM: HTMLElement): void {
    // const nodeDOM = this.editorView.domAtPos(selection.from).node;

    const OFFSET = (this.editor.storage?.media?.mediaFocusOffset ?? 0) + 50;

    const rect = nodeDOM.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    let scrollOffset = 0;

    if (rect.top < OFFSET) {
      scrollOffset = window.scrollY + rect.top - OFFSET;
    } else if (rect.bottom > viewportHeight - OFFSET) {
      scrollOffset = window.scrollY + (rect.bottom - viewportHeight) + OFFSET;
    }

    if (scrollOffset !== 0) {
      window.scrollTo({
        top: scrollOffset,
        behavior: 'instant',
      });
    }
  }

  public update(): void {
    if (this.updateLock) return;

    const { state } = this.view;
    const { selection, schema } = state;
    const { $from } = selection;

    if (selection.empty || !this.view.hasFocus()) {
      this.hideTooltip();
      return;
    }

    // if (isNodeActive(state, schema.nodes.codeBlock)) return;
    if ($from.parent.type.spec.code) return;

    if (selection instanceof NodeSelection) {
      const name = selection.node.type.name;
      if (name === 'image' || name === 'iframe') {
        const nodeDOM = this.view.nodeDOM(selection.from) as HTMLElement;
        this.scrollToMedia(nodeDOM);

        const grid = nodeDOM.parentElement?.parentElement;
        if (grid?.classList.contains('images-grid')) {
          this.hideTooltip();
          return;
        }

        this.hideTooltip(this.textTooltip);
        this.updateTooltipItemsStatus(this.mediaTooltip);
        this.showTooltip(this.mediaTooltip);
        return;
      }
    }

    this.hideTooltip(this.mediaTooltip);
    this.updateTooltipItemsStatus(this.textTooltip);
    this.showTooltip(this.textTooltip);
  }

  public destroy(): void {
    this.textTooltip.remove();
    this.mediaTooltip.remove();

    window.removeEventListener('blur', this.windowHandlers.blur);
    window.removeEventListener('focus', this.windowHandlers.focus);
    document.removeEventListener('visibilitychange', this.windowHandlers.visibilitychange);
    document.removeEventListener('mousedown', this.windowHandlers.mousedown);
    document.removeEventListener('mouseup', this.windowHandlers.mouseup);
  }
}
