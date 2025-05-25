import type { Command, EditorState } from "prosemirror-state";
import type { NodeType } from "prosemirror-model";

export function isSelectionNotInsideNodeType(nodeType: NodeType): Command {
  return (state: EditorState) => {
    const { from, to } = state.selection;
    const $from = state.doc.resolve(from);

    for (let depth = $from.depth; depth >= 0; depth--) {
      const node = $from.node(depth);

      if (node.type === nodeType) {
        const nodeEnd = $from.end(depth);
        return !(to <= nodeEnd);
      }
    }

    return true;
  };
}
