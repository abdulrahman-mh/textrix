import { exitCode } from 'prosemirror-commands';
import { type Command, Selection } from 'prosemirror-state';

/**
 * Exit code block on arrow down
 */
export const exitCodeOnArrowDown: Command = (state, dispatch) => {
  const { selection, doc } = state;
  const { $from, empty } = selection;

  if (!empty || $from.parent.type.name !== 'codeBlock') {
    return false;
  }

  const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;

  if (!isAtEnd) {
    return false;
  }

  const after = $from.after();

  if (after === undefined) {
    return false;
  }

  const nodeAfter = doc.nodeAt(after);

  if (nodeAfter) {
    if (dispatch) dispatch(state.tr.setSelection(Selection.near(doc.resolve(after))));
    return true;
  }

  return exitCode(state, dispatch);
};
