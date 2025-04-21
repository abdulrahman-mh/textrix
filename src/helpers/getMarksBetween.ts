import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { getMarkRange } from './getMarkRange';
import type { MarkRange } from '../types';

export function getMarksBetween(from: number, to: number, doc: ProseMirrorNode): MarkRange[] {
  const marks: MarkRange[] = [];

  // Get all inclusive marks on empty selection
  if (from === to) {
    const $pos = doc.resolve(from);

    for (const mark of $pos.marks()) {
      const range = getMarkRange($pos, mark.type);
      if (range) {
        marks.push({ mark, ...range });
      }
    }
  } else {
    doc.nodesBetween(from, to, (node, pos) => {
      if (node && node.nodeSize !== undefined) {
        for (const mark of node.marks) {
          marks.push({
            from: pos,
            to: pos + node.nodeSize,
            mark,
          });
        }
      }
    });
  }

  return marks;
}
