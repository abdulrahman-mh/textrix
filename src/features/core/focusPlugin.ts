import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Editor } from '../../Editor';

export const focusPluginKey = new PluginKey('focus');

export function focusPlugin(editor: Editor) {
  return new Plugin({
    key: focusPluginKey,

    state: {
      init() {
        return { decorations: DecorationSet.empty, from: null, to: null };
      },

      // @ts-ignore
      apply(tr, value) {
        const { selection } = tr;
        const $pos = selection.$head;

        // If selection is in the root node, we need to handle it differently.
        // Check if we're at the top level of the document
        let from = 0;
        let to = 0;
        
        // Ensure that we're dealing with a valid position
        if ($pos.depth > 0) {
          // Find the start of the top-level parent (depth 1)
          const topNodePos = $pos.before(1); // Get the position before the top-level node
          const node = tr.doc.nodeAt(topNodePos);
          
          if (!node) return { decorations: DecorationSet.empty, from: null, to: null };

          from = topNodePos;
          to = from + node.nodeSize; // Set the end position based on the node size
        }

        // Only decorate if selection is fully within that top-level node
        const isInside = selection.from >= from && selection.to <= to;
        if (!isInside) return { decorations: DecorationSet.empty, from: null, to: null };

        const decorations = DecorationSet.create(tr.doc, [
          Decoration.node(from, to, { class: 'is-selected' }),
        ]);

        return { decorations, from, to };
      },
    },

    props: {
      decorations(state) {
        return focusPluginKey.getState(state).decorations;
      },
    },
  });
}
