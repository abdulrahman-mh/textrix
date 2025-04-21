import type { EditorState } from 'prosemirror-state';
import type { NodeType } from 'prosemirror-model';
import type { NodeRange } from '../types';
import { objectIncludes } from './objectIncludes';

export default function isNodeActive(
  state: EditorState,
  type: NodeType,
  attributes: Record<string, any> = {},
): boolean {
  const { from, to, empty } = state.selection;

  const nodeRanges: NodeRange[] = [];

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.isText) {
      return;
    }

    const relativeFrom = Math.max(from, pos);
    const relativeTo = Math.min(to, pos + node.nodeSize);

    nodeRanges.push({
      node,
      from: relativeFrom,
      to: relativeTo,
    });
  });

  const selectionRange = to - from;
  const matchedNodeRanges = nodeRanges
    .filter((nodeRange) => {
      if (!type) {
        return true;
      }

      return type.name === nodeRange.node.type.name;
    })
    .filter((nodeRange) => objectIncludes(nodeRange.node.attrs, attributes));

  if (empty) {
    return !!matchedNodeRanges.length;
  }

  const range = matchedNodeRanges.reduce((sum, nodeRange) => sum + nodeRange.to - nodeRange.from, 0);

  return range >= selectionRange;
}
