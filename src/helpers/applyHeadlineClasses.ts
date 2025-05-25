import type { Fragment, Node } from 'prosemirror-model';
import type { VElement } from 'zeed-dom';

/**
 * Adds .title, .subtitle, and .kicker classes to the matched headline nodes.
 */
export function applyHeadlineClasses(container: HTMLElement | VElement, headlinePositions: Record<string, number>) {
  const { title, subtitle, kicker } = headlinePositions;
  Array.from(container.childNodes).forEach((node, index) => {
    if (!(node instanceof HTMLElement)) return;

    if (index === title) node.classList.add('title');
    if (index === subtitle) node.classList.add('subtitle');
    if (index === kicker) node.classList.add('kicker');
  });
}

export function applyHeadlineClassesToNode(
  node: Node | Fragment,
  headlinePositions: Record<string, number>
) {
  const { title, subtitle, kicker } = headlinePositions;

  // Keep track of all nodes that were modified
  const modifiedNodes: any[] = [];

  node.forEach((child: any, _, index: number) => {
    let newClass = null;
    if (index === title) newClass = 'title';
    else if (index === subtitle) newClass = 'subtitle';
    else if (index === kicker) newClass = 'kicker';

    if (newClass) {
      // @ts-ignore
      child.attrs.class = newClass;
      modifiedNodes.push(child);
    }
  });

  // Return cleanup function
  return function cleanup() {
    for (const child of modifiedNodes) {
      child.attrs.class = undefined;
    }
  };
}
