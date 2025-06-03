import { Feature } from '../../Feature';

import { type Command, TextSelection } from 'prosemirror-state';
import { nodeInputRule } from '../../inputRules';

declare module '../../types' {
  interface Commands {
    setHorizontalRule: Command;
  }
}

const Hr = Feature.create({
  name: 'divider',

  extendNodeSchema() {
    return {
      divider: {
        group: 'block',
        selectable: false,

        parseDOM: [{ tag: 'hr' }],
        toDOM() {
          return ['hr'];
        },
      },
    };
  },

  addFloatingMenuItems() {
    return [
      {
        name: 'newPart',
        priority: 400,
        title: this.editor.options.messages.addPart,
        execute: this.commands.setHorizontalRule,
      },
    ];
  },

  addCommands() {
    return {
      setHorizontalRule: (state, dispatch) => {
        const { tr, schema, selection } = state;
        const { $from } = selection;

        if (!selection.empty || $from.nodeAfter) {
          tr.replaceSelectionWith(schema.nodes.divider.create()).scrollIntoView();
        } else {
          const insertPosition = $from.after();

          const dividerNode = schema.nodes.divider.create();
          const paragraphNode = schema.nodes.paragraph.create();

          tr.insert(insertPosition, dividerNode);
          tr.insert(insertPosition + dividerNode.nodeSize, paragraphNode);

          tr.setSelection(TextSelection.near(tr.doc.resolve(insertPosition + dividerNode.nodeSize)));
          tr.scrollIntoView();
        }

        if (dispatch) dispatch(tr);

        // this.view.focus();

        return true;
      },
    };
  },

  addInputRules() {
    if (this.editor.options.markdownShortcuts) {
      return [
        nodeInputRule({
          find: /^(?:---|—-|___\s|\*\*\*\s)$/,
          type: this.schema.nodes.divider,
        }),
      ];
    }
    return [];
  },
});

export default Hr;
