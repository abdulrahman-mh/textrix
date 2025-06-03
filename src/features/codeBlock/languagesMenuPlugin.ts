import { autoUpdate } from '@floating-ui/dom';
import debounce from 'debounce';
import type { EditorView } from 'prosemirror-view';
import { languagesMapping, orderedLanguages } from './languages';
import type { Node } from 'prosemirror-model';
import type { Editor } from '../../Editor';
import PopoverHandler from '../popover';
import { Plugin, PluginKey } from 'prosemirror-state';

interface Popover {
  trigger: HTMLElement;
  container: HTMLElement;
  content: HTMLElement;
  arrow: HTMLElement;
}

const actionModes = {
  none: 0,
  auto: 1,
  explicit: 2,
};

export default class LanguagesMenu {
  private codeMenu?: Popover & { cleanupPosition?: () => void };
  private handleMouseUp: (e: MouseEvent) => void;

  constructor(
    private editor: Editor,
    private view: EditorView,
  ) {
    this.handleMouseUp = this.handleClick.bind(this);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  private handleClick(e: MouseEvent): void {
    const target = e.target as Element;

    // Handle clicks on the same code menu button (toggle behavior)
    const codeMenuTrigger = target.closest<HTMLElement>('.codeBlockMenu-button');
    if (codeMenuTrigger === this.codeMenu?.trigger) {
      this.removeCodeMenu();
      return;
    }

    // Show a new code menu if clicked on a different button
    if (codeMenuTrigger) {
      const pre = codeMenuTrigger.parentNode as HTMLElement;
      const name = pre.getAttribute('name');
      const { codeBlockLang: langs, codeBlockMode: mode } = pre.dataset;
      if (name && mode) {
        this.showCodeMenu({ name, langs, mode, trigger: codeMenuTrigger });
      }
      return;
    }

    // Handle clicks inside the code menu container
    if (this.codeMenu?.container.contains(target)) {
      // Check if the clicked element is a button
      const button = target.closest<HTMLButtonElement>('.codeBlock--button');
      if (button) {
        this.updateCodeBlock(button.dataset);
        this.removeCodeMenu();
      }
      return; // Do nothing if clicked inside but not on a button
    }

    // Remove code menu if clicking outside of it
    if (this.codeMenu) {
      this.removeCodeMenu();
    }
  }

  private updateCodeBlock(data: DOMStringMap): void {
    const { name, action, lang } = data;
    if (!name) return;

    const { state, dispatch } = this.view;
    let targetNode: Node | null = null;
    let targetPos: number | null = null;

    state.doc.descendants((node, pos) => {
      if (node.attrs.name === name && node.type.name === 'codeBlock') {
        targetNode = node;
        targetPos = pos;
      }
    });

    if (targetNode && targetPos !== null) {
      // @ts-ignore
      const mode = actionModes[action || 'none'] || 0;
      dispatch(
        state.tr.setNodeMarkup(targetPos, null, {
          // @ts-ignore
          ...targetNode.attrs,
          mode,
          language: lang,
        }),
      );
    }
  }

  private removeCodeMenu(): void {
    if (this.codeMenu) {
      this.codeMenu.cleanupPosition?.();
      this.codeMenu.container.remove();
      this.codeMenu = undefined;
    }
  }

  private showCodeMenu({ name, langs, mode, trigger }: Record<string, any>): void {
    this.removeCodeMenu();
    const { container, arrow, content } = PopoverHandler.createPopover('codeBlockMenu');
    this.codeMenu = { trigger, container, arrow, content };

    const list = document.createElement('ul');
    list.className = 'popover-list';
    for (const lang of ['none', 'auto', ...orderedLanguages]) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.dataset.action = lang === 'none' ? 'none' : lang === 'auto' ? 'auto' : 'explicit';
      btn.dataset.name = name;
      btn.className = 'codeBlock--button';
      if (lang !== 'none' && lang !== 'auto') btn.dataset.lang = lang;

      const label = document.createElement('span');
      label.innerText =
        lang === 'none'
          ? 'None'
          : lang === 'auto'
            ? `Auto${mode === '1' ? ` (${languagesMapping[lang] || lang})` : ''}`
            : languagesMapping[lang] || lang;
      btn.appendChild(label);

      if ((mode === '0' && lang === 'none') || (mode === '1' && lang === 'auto') || (mode === '2' && lang === langs)) {
        const icon = document.createElement('span');
        icon.style.float = 'right';
        icon.innerHTML = '<span class="svgIcon--19px"><svg width="19" height="19" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M13.76 4.743a.5.5 0 01.167.687l-5.841 9.558-3.95-4.181a.5.5 0 11.728-.687l3.05 3.23 5.16-8.441a.5.5 0 01.687-.166z" fill="currentColor"></path></svg></span>';
        btn.appendChild(icon);
      }

      li.appendChild(btn);
      list.appendChild(li);
    }

    content.appendChild(list);

    PopoverHandler.updatePosition(trigger, container, arrow);
    const cleanupPosition = autoUpdate(
      trigger,
      container,
      debounce(() => PopoverHandler.updatePosition(trigger, container, arrow), 200),
      {
        ancestorScroll: true,
        ancestorResize: true,
        elementResize: false,
        layoutShift: false,
        animationFrame: false,
      },
    );
    this.codeMenu.cleanupPosition = cleanupPosition;
    this.view.dom.parentElement?.appendChild(container);
  }

  public destroy(): void {
    if (this.codeMenu) this.removeCodeMenu();
    document.removeEventListener('mouseup', this.handleMouseUp);
  }
}

export function languagesMenuPlugin(editor: Editor) {
  return new Plugin({ key: new PluginKey('languesMenu'), view: (view) => new LanguagesMenu(editor, view) });
}
