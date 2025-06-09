import type { EditorView } from 'prosemirror-view';
import { resetFigureNode } from './helpers';

export class DragHandler {
  private dropCursor: HTMLElement | null = null;
  private isFirefox = /Firefox/.test(navigator.userAgent);
  private dragFigure: HTMLElement | null = null;
  private dragPlaceholder: HTMLElement | null;
  private boundHandlers: Record<string, EventListener> = {};

  constructor(private editorView: EditorView) {
    this.dragPlaceholder = document.createElement('div');
    this.dragPlaceholder.className = 'drag-placeholder';

    this.dropCursor = document.createElement('div');
    this.dropCursor.className = 'drop-cursor';

    this.editorView.dom.parentElement!.appendChild(this.dragPlaceholder);
    this.editorView.dom.parentElement!.appendChild(this.dropCursor);

    this.boundHandlers = {
      dragstart: (e) => this.handleDragStart(e as DragEvent),
      dragend: (e) => this.handleDragEnd(e as DragEvent),
      dragover: (e) => this.handleDragOver(e as DragEvent),
      drop: (e) => this.handleDrop(e as DragEvent),
    };

    for (const [event, handler] of Object.entries(this.boundHandlers)) {
      this.editorView.dom.addEventListener(event, handler as EventListener);
    }
  }

  private handleDragStart(event: DragEvent) {
    const target = event.target as HTMLImageElement;

    if (!target || target.tagName !== 'IMG') {
      event.preventDefault();
      return;
    }

    this.dragFigure = target.closest('figure');
    if (!this.dragPlaceholder) return;

    this.dragPlaceholder.innerHTML = '';
    this.dragPlaceholder.appendChild(target.cloneNode(true));

    /**
     * Firefox Bugs:
     * 1. If we set the image node as a placeholder he not care about his width or styles
     * 2. But if setting the image div wrapper as placeholder,
     *    he not render there image content in the first time.
     */
    const dragImage = this.isFirefox ? this.dragPlaceholder : this.dragPlaceholder.firstElementChild!;

    event.dataTransfer?.setDragImage(dragImage, 0, 0);
  }

  private handleDragEnd(_: DragEvent) {
    if (this.dragFigure) {
      this.dragFigure = null;
    }
    this.hideDropCursor();
  }

  private getClosestChild(event: DragEvent) {
    const { clientX, clientY, target } = event;
    if (!(target instanceof HTMLElement)) return null;

    const closestElement = target.closest('.textrix .images-grid > figure, .textrix > *');

    const isGrid = closestElement?.classList.contains('images-grid');
    const grid = closestElement?.closest('.images-grid');
    const isFigureCollapsed =
      closestElement?.tagName.toLocaleLowerCase() === 'figure' && !closestElement.querySelector('iframe') && !grid;

    // If the target point into a empty space, e.g margin
    if (target === this.editorView.dom || !closestElement || isGrid) {
      const element = this.findClosestChild(closestElement || this.editorView.dom, clientX, clientY);
      return element ? { element, isFigureCollapsed, grid } : null;
    }

    return { element: closestElement, isFigureCollapsed, grid };
  }

  private findClosestChild(parent: Element, x: number, y: number) {
    if (!parent || !parent.children.length) return null;

    let closestChild = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const child of parent.children) {
      // if (child === this.dragEvent) continue;

      const rect = child.getBoundingClientRect();
      const childX = Math.max(rect.left, Math.min(x, rect.right));
      const childY = Math.max(rect.top, Math.min(y, rect.bottom));

      const distance = Math.sqrt((childX - x) ** 2 + (childY - y) ** 2);

      if (distance < minDistance) {
        minDistance = distance;
        closestChild = child;
      }
    }

    return closestChild;
  }

  private resolveDropTarget(event: DragEvent) {
    const closest = this.getClosestChild(event);
    if (!closest || (closest.element === this.dragFigure && closest.isFigureCollapsed)) return;

    const isDraggingFromSameGrid = this.dragFigure?.closest('.images-grid') === closest.grid;

    // If dropping into a full grid from outside, redirect drop to grid itself
    if (closest.grid && closest.grid.children.length >= 3 && !isDraggingFromSameGrid) {
      closest.element = closest.grid;
      closest.grid = null;
    }

    const rect = closest.element.getBoundingClientRect();

    const insertBefore =
      closest.isFigureCollapsed || closest.grid
        ? event.clientX - rect.left < rect.width / 2
        : event.clientY - rect.top < rect.height / 2;

    return { ...closest, insertBefore };
  }

  private handleDragOver(event: DragEvent) {
    const result = this.resolveDropTarget(event);
    if (result) {
      this.updateDropCursor(result);
      event.preventDefault();
    } else {
      this.hideDropCursor();
    }
  }

  private updateDropCursor({
    element,
    insertBefore,
    isFigureCollapsed,
    grid,
  }: {
    element: Element;
    insertBefore: boolean;
    grid?: Element | null;
    isFigureCollapsed?: boolean;
  }) {
    if (!this.dropCursor) return;

    const { scrollX, scrollY } = window;
    this.dropCursor.classList.add('active');

    const isOverImage = element.tagName.toLowerCase() === 'figure' && !element.querySelector('iframe');
    const referenceElement = isOverImage ? element.querySelector('img')! : element;
    const rect = referenceElement.getBoundingClientRect();

    const prevSibling = element.previousElementSibling;
    const nextSibling = element.nextElementSibling;

    this.dropCursor.style.transition = 'none';

    let isHorizontal = false;

    if (isFigureCollapsed || grid) {
      // Drop cursor for horizontal placement
      isHorizontal = true;

      let cursorLeft: number;

      if (grid) {
        const gap = 10;
        const adjustment = 2; // half of cursor width (4px / 2)

        if (insertBefore && element.previousElementSibling) {
          const prevRect = element.previousElementSibling.getBoundingClientRect();
          cursorLeft = (prevRect.right + rect.left) / 2 - adjustment;
        } else if (!insertBefore && element.nextElementSibling) {
          const nextRect = element.nextElementSibling.getBoundingClientRect();
          cursorLeft = (rect.right + nextRect.left) / 2 - adjustment;
        } else {
          // At the start or end of the grid
          cursorLeft = insertBefore ? rect.left - gap / 2 - adjustment : rect.right + gap / 2 - adjustment;
        }
      } else {
        // Fallback for non-grid horizontal insert (e.g. between figures)
        cursorLeft = insertBefore ? rect.left - 2 : rect.right - 2;
      }

      Object.assign(this.dropCursor.style, {
        left: `${scrollX + cursorLeft}px`,
        width: '4px',
        height: `${rect.height}px`,
        top: `${scrollY + rect.top}px`,
        transition: 'left 75ms ease-out',
      });
    } else {
      let midpointY: number;

      if (insertBefore && prevSibling) {
        const prevRect = prevSibling.getBoundingClientRect();
        midpointY = (prevRect.bottom + rect.top) / 2;
      } else if (!insertBefore && nextSibling) {
        const nextRect = nextSibling.getBoundingClientRect();
        midpointY = (rect.bottom + nextRect.top) / 2;
      } else {
        midpointY = insertBefore ? rect.top : rect.bottom;
      }

      // TODO: Always place the horizontal cursor with the editor text column, and ignore editor padding space

      // Drop cursor for vertical placement
      Object.assign(this.dropCursor.style, {
        width: `${rect.width}px`,
        height: '4px',
        left: `${scrollX + rect.left}px`,
        top: `${scrollY + midpointY - 2}px`,
        transition: 'top 75ms ease-out',
      });
    }

    // Drop animation
    let nodeA: Element | null = null;
    let nodeB: Element | null = null;

    if (insertBefore) {
      nodeA = element.previousElementSibling || element;
      nodeB = element;
    } else {
      nodeA = element;
      nodeB = element.nextElementSibling || element;
    }

    if (nodeA && nodeB && nodeA !== nodeB) {
      this.dispatchDropAnimation(nodeA, nodeB, isHorizontal);
    } else if (nodeA) {
      this.dispatchDropAnimation(nodeA, nodeA, isHorizontal);
    } else {
      this.clearDropAnimation();
    }
  }

  private clearDropAnimation() {
    const { state, dispatch } = this.editorView;
    dispatch(state.tr.setMeta('refreshMediaDropAnimation', {}));
  }

  private dispatchDropAnimation(elementA?: Element, elementB?: Element, isHorizontal = false) {
    if (!elementA || !elementB) {
      this.clearDropAnimation();
      return;
    }

    const { state, dispatch } = this.editorView;

    const posA = this.editorView.posAtDOM(elementA, 0) - 1;
    const posB = this.editorView.posAtDOM(elementB, 0) - 1;
    const sizeA = state.doc.nodeAt(posA)?.nodeSize || 0;
    const sizeB = state.doc.nodeAt(posB)?.nodeSize || 0;

    const classA = isHorizontal ? 'drop-animation-left' : 'drop-animation-up';
    const classB = isHorizontal ? 'drop-animation-right' : 'drop-animation-down';

    dispatch(
      state.tr.setMeta('refreshMediaDropAnimation', {
        positions: [
          { from: posA, to: posA + sizeA, class: classA },
          { from: posB, to: posB + sizeB, class: classB },
        ],
      }),
    );
  }

  private hideDropCursor() {
    this.clearDropAnimation();
    if (this.dropCursor) {
      this.dropCursor.classList.remove('active');
    }
  }

  private handleDrop(event: DragEvent) {
    event.preventDefault();

    const { dataTransfer } = event;
    const { state, dispatch } = this.editorView;
    const { tr, schema } = state;

    const dropResult = this.resolveDropTarget(event);
    if (!dropResult) return;

    if (this.dragFigure) {
      // Handle internal drop
      const figurePos = this.editorView.posAtDOM(this.dragFigure, 0) - 1;
      const figureNode = state.doc.nodeAt(figurePos);
      const targetPos = this.editorView.posAtDOM(dropResult.element, 0) - 1;
      const targetNode = state.doc.nodeAt(targetPos);

      if (!targetNode || !figureNode) return;

      // Wrap the target and current figure inside a grid
      if (dropResult.isFigureCollapsed && !dropResult.grid) {
        const content = dropResult.insertBefore ? [figureNode, targetNode] : [targetNode, figureNode];

        const gridNode = schema.nodes.imagesGrid.create(null, content);

        tr.delete(figurePos, figurePos + figureNode.nodeSize);
        const targetPosMap = tr.mapping.map(targetPos);
        tr.delete(targetPosMap, targetPosMap + targetNode.nodeSize);
        tr.insert(tr.mapping.map(targetPos), gridNode);
      } else {
        // Direct insert before or after
        tr.delete(figurePos, figurePos + figureNode.nodeSize);

        const placementPos = dropResult.insertBefore ? targetPos : targetPos + targetNode.nodeSize;

        const nodeToInsert =
          !dropResult.grid && figureNode.firstChild?.attrs.layout === 'grid' ? resetFigureNode(figureNode) : figureNode;

        tr.insert(tr.mapping.map(placementPos), nodeToInsert);
      }

      dispatch(tr);
    } else if (dataTransfer && dataTransfer.files.length > 0) {
      // Handle drops from external sources, e.g Desktop
      // Chrome Only: Drop from other tab in the browser

      const imageFiles = Array.from(dataTransfer.files).filter((file) => file.type.startsWith('image/'));
    }
    this.dragFigure = null;
    this.hideDropCursor();
  }

  public destroy() {
    for (const [event, handler] of Object.entries(this.boundHandlers)) {
      this.editorView.dom.removeEventListener(event, handler);
    }

    this.dropCursor?.remove();
    this.dropCursor = null;

    this.dragPlaceholder?.remove();
    this.dragPlaceholder = null;

    this.dragFigure = null;
  }
}
