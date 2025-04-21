import type { EditorState, Transaction } from 'prosemirror-state';
import { getMarkAttributes } from '../helpers/getMarkAttributes';
import type { MarkType } from 'prosemirror-model';

const setMark =
  (type: MarkType, attributes: Record<string, any> = {}) =>
  (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const { selection, tr } = state;
    const { empty, ranges } = selection;

    if (dispatch) {
      if (empty) {
        const oldAttributes = getMarkAttributes(state, type);

        tr.addStoredMark(
          type.create({
            ...oldAttributes,
            ...attributes,
          }),
        );
      } else {
        for (const range of ranges) {
          const from = range.$from.pos;
          const to = range.$to.pos;

          state.doc.nodesBetween(from, to, (node, pos) => {
            const trimmedFrom = Math.max(pos, from);
            const trimmedTo = Math.min(pos + node.nodeSize, to);
            const someHasMark = node.marks.find((mark) => mark.type === type);

            // if there is already a mark of this type
            // we know that we have to merge its attributes
            // otherwise we add a fresh new mark
            if (someHasMark) {
              for (const mark of node.marks) {
                if (type === mark.type) {
                  tr.addMark(
                    trimmedFrom,
                    trimmedTo,
                    type.create({
                      ...mark.attrs,
                      ...attributes,
                    }),
                  );
                }
              }
            } else {
              tr.addMark(trimmedFrom, trimmedTo, type.create(attributes));
            }
          });
        }
      }

      dispatch(tr);
    }
    return false;
  };

export default setMark;
