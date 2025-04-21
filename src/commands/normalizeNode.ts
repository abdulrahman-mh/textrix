import { type EditorState, Selection, type Transaction } from 'prosemirror-state';
import clearNodes from './clearNodes';

// May convert first text block to paragraph
export default function normalizeNode(state: EditorState, dispatch?: (tr: Transaction) => void) {
  const { selection, doc } = state;
  const { empty, $anchor } = selection;
  const { pos, parent } = $anchor;
  const $parentPos = $anchor.parent.isTextblock && pos > 0 ? doc.resolve(pos - 1) : $anchor;
  const parentIsIsolating = $parentPos.parent.type.spec.isolating;

  const parentPos = $anchor.pos - $anchor.parentOffset;

  const isAtStart =
    parentIsIsolating && $parentPos.parent.childCount === 1
      ? parentPos === $anchor.pos
      : Selection.atStart(doc).from === pos;

  // Delete the first line if he empty
  if (isAtStart && doc.childCount > 1 && parent.textContent === '') {
    const firstNode = doc.firstChild;

    // Check if the first node is inside a list or another block
    if ($anchor.depth > 1) {
      return false;
    }

    if (dispatch) dispatch(state.tr.delete(0, parent.nodeSize));
    return true;
  }

  // Remove code block when at start of document or code block is empty
  if (empty && $anchor.parent.type.name === 'codeBlock' && (isAtStart || !parent.textContent.length)) {
    return clearNodes(state, dispatch);
  }

  if (
    !empty ||
    !parent.type.isTextblock ||
    parent.textContent.length ||
    !isAtStart ||
    (isAtStart && $anchor.parent.type.name === 'paragraph') // prevent clearNodes when no nodes to clear, otherwise history stack is appended
  ) {
    return false;
  }

  return clearNodes(state, dispatch);
}
