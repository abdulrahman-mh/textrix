import { TextSelection } from 'prosemirror-state';
import { resolveFocusPosition } from '../helpers/resolveFocusPosition';
import type { FocusPosition } from '../types';
import type { Editor } from '../Editor';
import type { EditorView } from 'prosemirror-view';

export const focus =
  (position: FocusPosition = null, options: { scrollIntoView?: boolean } = { scrollIntoView: true }) =>
  ({ editor, view }: { editor: Editor; view: EditorView }) => {
    const { state, dispatch } = view;
    const { tr } = state;

    const delayedFocus = () => {
      (view.dom as HTMLElement).focus();

      // For React we have to focus asynchronously. Otherwise wild things happen.
      // see: https://github.com/ueberdosis/tiptap/issues/1520
      requestAnimationFrame(() => {
        if (!editor.isDestroyed) {
          view.focus();

          if (options?.scrollIntoView) {
            tr.scrollIntoView();
          }
        }
      });
    };

    if ((view.hasFocus() && position === null) || position === false) {
      return true;
    }

    // we don’t try to resolve a NodeSelection or CellSelection
    if (position === null && !(state.selection instanceof TextSelection)) {
      delayedFocus();
      return true;
    }

    // pass through tr.doc instead of editor.state.doc
    // since transactions could change the editors state before this command has been run
    const selection = resolveFocusPosition(tr.doc, position) || state.selection;
    const isSameSelection = state.selection.eq(selection);

    if (!isSameSelection) {
      tr.setSelection(selection);
    }

    // `tr.setSelection` resets the stored marks
    // so we’ll restore them if the selection is the same as before
    if (isSameSelection && tr.storedMarks) {
      tr.setStoredMarks(tr.storedMarks);
    }

    delayedFocus();

    dispatch(tr);
    return true;
  };
