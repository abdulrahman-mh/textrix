import type { Node as ProseMirrorNode } from 'prosemirror-model';

/**
 * Returns true if the given prosemirror node is empty.
 */
export function isNodeEmpty(
  node: ProseMirrorNode,
  {
    checkChildren = true,
    ignoreWhitespace = false,
  }: {
    /**
     * When true (default), it will also check if all children are empty.
     */
    checkChildren?: boolean;
    /**
     * When true, it will ignore whitespace when checking for emptiness.
     */
    ignoreWhitespace?: boolean;
  } = {},
): boolean {
  if (ignoreWhitespace) {
    if (node.type.name === 'hardBreak') {
      // Hard breaks are considered empty
      return true;
    }
    if (node.isText) {
      return /^\s*$/m.test(node.text ?? '');
    }
  }

  if (node.isText) {
    return !node.text;
  }

  if (node.isAtom || node.isLeaf) {
    return false;
  }

  if (node.content.childCount === 0) {
    return true;
  }

  if (checkChildren) {
    for (let i = 0; i < node.content.childCount; i++) {
      const childNode = node.content.child(i);

      if (!isNodeEmpty(childNode, { ignoreWhitespace, checkChildren })) {
        return false; // Exit early for performance
      }
    }
    return true;
  }

  return false;
}
