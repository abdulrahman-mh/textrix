import { arrow, autoPlacement, computePosition, offset, shift } from '@floating-ui/dom';
import debounce from 'debounce';
import type { Editor } from '../Editor';
import type { EditorView } from 'prosemirror-view';
import { Plugin, PluginKey } from 'prosemirror-state';
import { createElement } from '../util/createElement';

interface PopoverElement extends HTMLElement {
  _cleanup?: () => void;
  _cancelCleanup?: () => void;
}

interface Popover {
  trigger: PopoverElement;
  container: HTMLElement;
  content: HTMLElement;
  arrow: HTMLElement;
}

export interface PopoverRule {
  className?: string;
  find: (target: PopoverElement) => boolean;
  content: (target: PopoverElement) => string | HTMLElement | null | undefined;
}

export default class PopoverHandler {
  private hoverTooltip?: Popover;
  private updateDebounce: (e: Event) => void;

  constructor(
    private editor: Editor,
    private view: EditorView,
    private rules: PopoverRule[],
  ) {
    this.updateDebounce = debounce(this.handleHover.bind(this), 30);
    document.addEventListener('mouseover', this.updateDebounce);
  }

  private handleHover(e: Event): void {
    const target = e.target as PopoverElement;

    for (const rule of this.rules) {
      if (rule.find(target)) {
        const content = rule.content(target);
        if (!content) continue;
        this.showTooltip(target, content, rule.className);
        break;
      }
    }
  }

  private showTooltip(trigger: PopoverElement, insertedContent: string | HTMLElement, className?: string): void {
    // Singleton pattern
    if (this.hoverTooltip) {
      this.removeListeners(this.hoverTooltip);

      if (typeof insertedContent === 'string') {
        this.hoverTooltip.content.innerText = insertedContent;
      } else {
        this.hoverTooltip.content.replaceChildren(insertedContent);
      }

      this.hoverTooltip.trigger = trigger;
    } else {
      const { container, arrow, content } = PopoverHandler.createPopover(className);

      if (typeof insertedContent === 'string') {
        content.innerText = insertedContent;
      } else {
        content.replaceChildren(insertedContent);
      }

      this.hoverTooltip = { trigger, container, content, arrow };
      this.view.dom.parentElement?.appendChild(container);
    }

    PopoverHandler.updatePosition(trigger, this.hoverTooltip.container, this.hoverTooltip.arrow);
    this.attachListeners(this.hoverTooltip, this.removeTooltip.bind(this));
  }

  private removeTooltip(): void {
    if (this.hoverTooltip) {
      this.hoverTooltip.container.remove();
      this.hoverTooltip = undefined;
    }
  }

  static createPopover(className?: string): {
    container: HTMLElement;
    content: HTMLElement;
    arrow: HTMLElement;
  } {
    const content = createElement('div', { className: 'popover-inner' });
    const arrow = createElement('div', { className: 'popover-arrow' });
    const container = createElement('div', { className: 'popover', children: [content, arrow] });

    if (className) {
      container.classList.add(...className.split(' '));
    }

    return { container, content, arrow };
  }

  private attachListeners(popover: Popover, cleanup: () => void): void {
    let timer: number;

    const scheduleCleanup = () => {
      timer = window.setTimeout(() => {
        cleanup();
        this.removeListeners(popover);
      }, 300);
    };

    const cancelCleanup = () => clearTimeout(timer);

    popover.trigger.addEventListener('mouseleave', scheduleCleanup);
    popover.trigger.addEventListener('mouseenter', cancelCleanup);
    popover.container.addEventListener('mouseenter', cancelCleanup);
    popover.container.addEventListener('mouseleave', scheduleCleanup);

    popover.trigger._cleanup = scheduleCleanup;
    popover.trigger._cancelCleanup = cancelCleanup;
  }

  private removeListeners(popover: Popover): void {
    const { trigger, container } = popover;

    trigger._cancelCleanup?.();
    trigger.removeEventListener('mouseleave', trigger._cleanup as any);
    trigger.removeEventListener('mouseenter', trigger._cancelCleanup as any);
    container.removeEventListener('mouseleave', trigger._cleanup as any);
    container.removeEventListener('mouseenter', trigger._cancelCleanup as any);

    trigger._cleanup = undefined;
    trigger._cancelCleanup = undefined;
  }

  static async updatePosition(trigger: HTMLElement, container: HTMLElement, arrowElem: HTMLElement): Promise<void> {
    try {
      const allowedPlacements: any[] = [];
      if (trigger.dataset.tooltipPosition) {
        allowedPlacements.push(trigger.dataset.tooltipPosition);
      } else {
        allowedPlacements.push('top', 'bottom');
      }

      const { x, y, placement, middlewareData } = await computePosition(trigger, container, {
        middleware: [
          // offset(6),
          shift({ padding: 5 }),
          autoPlacement({ padding: 0, allowedPlacements }),
          arrow(() => {
            return { element: arrowElem };
          }),
        ],
      });

      Object.assign(container.style, { left: `${x}px`, top: `${y}px` });
      const { x: arrowX, y: arrowY } = middlewareData.arrow || {};
      // const staticSide = {
      //   top: 'bottom',
      //   bottom: 'top',
      //   left: 'right',
      //   right: 'left',
      // }[placement.split('-')[0]];

      container.classList.add(placement.split('-')[0]);

      Object.assign(arrowElem.style, {
        left: arrowX != null ? `${arrowX}px` : '',
        top: arrowY != null ? `${arrowY}px` : '',
      });
    } catch {
      // ...
    }
  }

  public destroy(): void {
    if (this.hoverTooltip) this.removeTooltip();

    document.removeEventListener('mouseover', this.updateDebounce);
    (this.updateDebounce as any).clear();
  }
}

export function popoverPlugin(editor: Editor, rules: PopoverRule[]) {
  return new Plugin({ key: new PluginKey('popover'), view: (view) => new PopoverHandler(editor, view, rules) });
}
