import type { EditorState, Transaction } from "prosemirror-state";

export function undoInputRule(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) {
  const plugins = state.plugins;

  for (let i = 0; i < plugins.length; i += 1) {
    const plugin = plugins[i];
    let undoable: any;

    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
      // Check if we're in a list item context where backspaceInList should handle the backspace
      const { selection } = state;
      const { $from, empty } = selection;

      // If we're at the start of a paragraph inside a list item, let backspaceInList handle it
      if (
        empty &&
        $from.parentOffset === 0 &&
        $from.parent.type.name === "paragraph" &&
        $from.depth >= 2 &&
        $from.node(-1).type.name === "listItem"
      ) {
        return false;
      }

      if (dispatch) {
        const tr = state.tr;
        const toUndo = undoable.transform;

        for (let j = toUndo.steps.length - 1; j >= 0; j -= 1) {
          tr.step(toUndo.steps[j].invert(toUndo.docs[j]));
        }

        if (undoable.text) {
          const marks = tr.doc.resolve(undoable.from).marks();

          tr.replaceWith(
            undoable.from,
            undoable.to,
            state.schema.text(undoable.text, marks)
          );
        } else {
          tr.delete(undoable.from, undoable.to);
        }

        dispatch(tr);
      }

      return true;
    }
  }

  return false;
}
