import type { EditorState, Transaction } from 'prosemirror-state';

export function undoInputRule(state: EditorState, dispatch?: (tr: Transaction) => void) {
  const plugins = state.plugins;

  for (let i = 0; i < plugins.length; i += 1) {
    const plugin = plugins[i];
    let undoable: any;

    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    if (plugin.spec.isInputRules && (undoable = plugin.getState(state))) {
      if (dispatch) {
        const tr = state.tr;
        const toUndo = undoable.transform;

        for (let j = toUndo.steps.length - 1; j >= 0; j -= 1) {
          tr.step(toUndo.steps[j].invert(toUndo.docs[j]));
        }

        if (undoable.text) {
          const marks = tr.doc.resolve(undoable.from).marks();

          tr.replaceWith(undoable.from, undoable.to, state.schema.text(undoable.text, marks));
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
