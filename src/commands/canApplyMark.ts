import type { MarkType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';

export function canApplyMark(state: EditorState, type: MarkType) {
  const { from, to, empty } = state.selection;

  // If the selection is empty, check the node at the selection
  if (empty) {
    return type.isInSet(state.selection.$from.marks()) === null;
  }

  // If the selection has content, check the range
  let applicable = false;
  state.doc.nodesBetween(from, to, (node) => {
    if (applicable) return false; // Short-circuit if already applicable
    applicable = node.inlineContent && type.isInSet(node.marks) === null;
  });
  return applicable;
}
