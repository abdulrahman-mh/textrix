import type { MarkType } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';
import { getMarkRange } from '../helpers/getMarkRange';

const unsetMark =
  (
    type: MarkType,
    options: {
      /**
       * Removes the mark even across the current selection. Defaults to `false`.
       */
      extendEmptyMarkRange?: boolean;

      /**
       * Fully remove mark even if the selection includes part of it. Defaults to `false`.
       */
      fullyRemoveMark?: boolean;
    } = {},
  ) =>
  (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const { extendEmptyMarkRange = false, fullyRemoveMark = false } = options;
    const { selection, tr } = state;
    const { $from, empty, ranges } = selection;

    if (!dispatch) {
      return true;
    }

    if (empty && extendEmptyMarkRange) {
      // Handle empty selection with extended mark range
      let { from, to } = selection;
      const attrs = $from.marks().find((mark) => mark.type === type)?.attrs;
      const range = getMarkRange($from, type, attrs);

      if (range) {
        from = range.from;
        to = range.to;
      }

      tr.removeMark(from, to, type);
    } else if (fullyRemoveMark) {
      // Handle full mark removal
      for (const { $from, $to } of ranges) {
        let from = $from.pos;
        let to = $to.pos;

        // Expand the range to fully cover marks of the same type
        const startRange = getMarkRange($from, type);
        const endRange = getMarkRange($to, type);

        if (startRange) {
          from = Math.min(from, startRange.from);
        }
        if (endRange) {
          to = Math.max(to, endRange.to);
        }

        tr.removeMark(from, to, type);
      }
    } else {
      // Handle normal mark removal
      for (const { $from, $to } of ranges) {
        tr.removeMark($from.pos, $to.pos, type);
      }
    }

    tr.removeStoredMark(type);

    dispatch(tr);
    return true;
  };

export default unsetMark;
