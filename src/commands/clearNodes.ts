import type { EditorState, Transaction } from 'prosemirror-state';
import { liftTarget } from 'prosemirror-transform';

// Normalize nodes to a simple paragraph.
export default function clearNodes(state: EditorState, dispatch?: (tr: Transaction) => void) {
  const { tr } = state;
  const { selection } = tr;
  const { ranges } = selection;

  if (!dispatch) {
    return true;
  }

  for (const { $from, $to } of ranges) {
    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      if (node.type.isText) {
        return;
      }

      const { doc, mapping } = tr;
      const $mappedFrom = doc.resolve(mapping.map(pos));
      const $mappedTo = doc.resolve(mapping.map(pos + node.nodeSize));
      const nodeRange = $mappedFrom.blockRange($mappedTo);

      if (!nodeRange) {
        return;
      }

      const targetLiftDepth = liftTarget(nodeRange);

      if (node.type.isTextblock) {
        const { defaultType } = $mappedFrom.parent.contentMatchAt($mappedFrom.index());

        tr.setNodeMarkup(nodeRange.start, defaultType);
      }

      if (targetLiftDepth !== null) {
        tr.lift(nodeRange, targetLiftDepth);
      }
    });
  }

  dispatch(tr);

  return true;
}
