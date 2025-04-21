import isNodeActive from '../../helpers/isNodeActive';
import type { EditorState, Transaction } from 'prosemirror-state';
import { setBlockType } from 'prosemirror-commands';

/**
 * Functions to use with cycled operations, e.g cycle-quote nodes
 */
export function cycleNodes(state: EditorState, dispatch: (tr: Transaction) => void, nodes: any[]): void {
  for (let i = 0; i < nodes.length; i++) {
    if (isNodeActive(state, nodes[i])) {
      const nextNode = nodes[(i + 1) % nodes.length];
      setBlockType(nextNode)(state, dispatch);
      return;
    }
  }
  setBlockType(nodes[0])(state, dispatch);
}

export function chainIsActive(...checks: Array<(state: EditorState) => boolean>): (state: EditorState) => boolean {
  return (state: EditorState) => {
    for (const check of checks) {
      if (check(state)) {
        return true; // Return `true` if any `isActive` check passes
      }
    }
    return false; // Return `false` if none of the checks pass
  };
}
