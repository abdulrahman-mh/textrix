import { Plugin, PluginKey, type Transaction } from 'prosemirror-state';

const notAfter = ['paragraph', 'h3', 'h4', 'blockquote', 'pullquote'];

const pluginKey = new PluginKey('trailingNode');

export function trailingNodePlugin() {
  return new Plugin({
    key: pluginKey,
    appendTransaction: (_, __, state): Transaction | undefined => {
      const shouldInsertNodeAtEnd = pluginKey.getState(state);

      if (!shouldInsertNodeAtEnd) {
        return;
      }

      const { doc, tr, schema } = state;
      const { anchor } = state.selection;
      const endPosition = doc.content.size;

      // We creates a second node, but still on the first node, can happen when creating codeBlock or lists on the first node
      if (doc.childCount === 1 && (anchor === 0 || anchor <= doc.child(0).nodeSize)) {
        tr.setMeta('removePlaceholder', { pos: endPosition });
      }

      return tr.insert(endPosition, schema.nodes.paragraph.create());
    },
    state: {
      init: (_, state) => {
        const lastNode = state.tr.doc.lastChild;

        return !(lastNode && notAfter.includes(lastNode.type.name));
      },
      apply: (tr, value) => {
        if (!tr.docChanged) {
          return value;
        }

        const lastNode = tr.doc.lastChild;

        return !(lastNode && notAfter.includes(lastNode.type.name));
      },
    },
  });
}
