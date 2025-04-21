import toggleNode from '../../commands/toggleNode';
import type { Command } from 'prosemirror-state';
import { Feature } from '../../Feature';
import isNodeActive from '../../helpers/isNodeActive';
import { textblockTypeInputRule } from '../../inputRules';
import { isSelectionNotInsideNodeType } from '../../commands/isSelectionNotInsideNodeType';

declare module '../../types' {
  interface Commands {
    toggleH4: Command;
  }
}

/**
 * Matched `#` at the start of line to convert it to big title
 */
export const inputRule = /^##\s$/;

const H4 = Feature.create({
  name: 'h4',

  extendNodeSchema() {
    return {
      h4: {
        content: 'inline*',
        group: 'block',
        marks: 'link',
        parseDOM: [{ tag: 'h4' }],
        toDOM: ({ HTMLAttributes }) => ['h4', HTMLAttributes, 0],
      },
    };
  },

  addBubbleMenuItems() {
    return [
      {
        name: this.name,
        type: 'text',
        priority: 600,
        isActive: (state) => isNodeActive(state, this.schema.nodes.h4),
        execute: toggleNode(this.schema.nodes.h4, this.schema.nodes.paragraph),
        isVisible: isSelectionNotInsideNodeType(this.schema.nodes.figcaption),
        icon: this.editor.options.icons.tSmaller,
        title: this.editor.options.messages.smallTitle,
      },
    ];
  },

  addCommands() {
    return {
      toggleH4: toggleNode(this.schema.nodes.h4, this.schema.nodes.paragraph),
    };
  },

  addKeyboardShortcuts() {
    return { 'Mod-Alt-2': this.commands.toggleH4 };
  },
  addInputRules() {
    if (this.editor.options.markdownShortcuts) {
      return [textblockTypeInputRule({ find: inputRule, type: this.schema.nodes.h4 })];
    }
    return [];
  },
});

export default H4;
