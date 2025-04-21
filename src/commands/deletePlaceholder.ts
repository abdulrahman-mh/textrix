import type { EditorState, Transaction } from 'prosemirror-state';

export function deletePlaceholder(state: EditorState, dispatch?: (tr: Transaction) => void) {
  const { selection } = state;
  const { $anchor, empty } = selection;

  if (empty && !$anchor.parent.textContent) {
    if (dispatch) dispatch(state.tr.setMeta('removePlaceholder', { pos: selection.from - 1 }));
    return true;
  }
  return false;
}
