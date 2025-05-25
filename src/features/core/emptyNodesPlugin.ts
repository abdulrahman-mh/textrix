import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Node as ProseMirrorNode } from 'prosemirror-model';

export function emptyNodesPlugin() {
  return new Plugin<DecorationSet>({
    key: new PluginKey('emptyFigcaptionPlugin'),

    props: {
      decorations(state) {
        return this.getState(state);
      },
    },

    state: {
      init(_, { doc }) {
        return DecorationSet.create(doc, findEmptyNodes(doc));
      },
      apply(tr, oldDecoSet, oldState, newState) {
        if (!tr.docChanged && !tr.selectionSet) {
          return oldDecoSet;
        }
        return DecorationSet.create(tr.doc, findEmptyNodes(tr.doc));
      },
    },
  });
}

function findEmptyNodes(doc: ProseMirrorNode): Decoration[] {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    // Just handle empty figcaption right now
    if (node.type.name === 'figcaption' && node.content.size === 0) {
      decorations.push(
        Decoration.node(pos, pos + node.nodeSize, {
          class: 'isEmpty',
        }),
      );
    }
  });

  return decorations;
}
