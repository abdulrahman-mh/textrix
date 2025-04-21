import type { MarkType, ResolvedPos } from 'prosemirror-model';
import { type EditorState, TextSelection } from 'prosemirror-state';

export default function canSetMark(state: EditorState, newMarkType: MarkType) {
  const { selection } = state;
  let cursor: ResolvedPos | null = null;

  if (selection instanceof TextSelection) {
    cursor = selection.$cursor;
  }

  if (cursor) {
    const currentMarks = state.storedMarks ?? cursor.marks();

    // There can be no current marks that exclude the new mark
    return !!newMarkType.isInSet(currentMarks) || !currentMarks.some((mark) => mark.type.excludes(newMarkType));
  }

  const { ranges } = selection;

  return ranges.some(({ $from, $to }) => {
    let someNodeSupportsMark =
      $from.depth === 0 ? state.doc.inlineContent && state.doc.type.allowsMarkType(newMarkType) : false;

    state.doc.nodesBetween($from.pos, $to.pos, (node, _pos, parent) => {
      // If we already found a mark that we can enable, return false to bypass the remaining search
      if (someNodeSupportsMark) {
        return false;
      }

      if (node.isInline) {
        const parentAllowsMarkType = !parent || parent.type.allowsMarkType(newMarkType);
        const currentMarksAllowMarkType =
          !!newMarkType.isInSet(node.marks) || !node.marks.some((otherMark) => otherMark.type.excludes(newMarkType));

        someNodeSupportsMark = parentAllowsMarkType && currentMarksAllowMarkType;
      }
      return !someNodeSupportsMark;
    });

    return someNodeSupportsMark;
  });
}
