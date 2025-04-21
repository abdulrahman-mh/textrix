import type { EditorState } from 'prosemirror-state';
import { objectIncludes } from './objectIncludes';
import type { MarkType } from 'prosemirror-model';
import type { MarkRange } from '../types';

export function isMarkActive(
  state: EditorState,
  type: MarkType,
  attributes: Record<string, any> = {},
  checkFully = true,
): boolean {
  const { empty, ranges } = state.selection;

  if (empty) {
    return !!(state.storedMarks || state.selection.$from.marks())
      .filter((mark) => {
        if (!type) {
          return true;
        }

        return type.name === mark.type.name;
      })
      .find((mark) => objectIncludes(mark.attrs, attributes));
  }

  let selectionRange = 0;
  const markRanges: MarkRange[] = [];

  for (const { $from, $to } of ranges) {
    const from = $from.pos;
    const to = $to.pos;

    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText && !node.marks.length) {
        return;
      }

      const relativeFrom = Math.max(from, pos);
      const relativeTo = Math.min(to, pos + node.nodeSize);
      const range = relativeTo - relativeFrom;

      selectionRange += range;

      markRanges.push(
        ...node.marks.map((mark) => ({
          mark,
          from: relativeFrom,
          to: relativeTo,
        })),
      );
    });
  }

  if (selectionRange === 0) {
    return false;
  }

  // calculate range of matched mark
  const matchedRange = markRanges
    .filter((markRange) => {
      if (!type) {
        return true;
      }

      return type.name === markRange.mark.type.name;
    })
    .filter((markRange) => objectIncludes(markRange.mark.attrs, attributes))
    .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);

  if (!checkFully) {
    // For partial match, return true if any part of the selection matches
    return matchedRange > 0;
  }

  // calculate range of marks that excludes the searched mark
  // for example `code` doesn’t allow any other marks
  const excludedRange = markRanges
    .filter((markRange) => {
      if (!type) {
        return true;
      }

      return markRange.mark.type !== type && markRange.mark.type.excludes(type);
    })
    .reduce((sum, markRange) => sum + markRange.to - markRange.from, 0);

  // we only include the result of `excludedRange`
  // if there is a match at all
  const range = matchedRange > 0 ? matchedRange + excludedRange : matchedRange;

  return range >= selectionRange;
}
