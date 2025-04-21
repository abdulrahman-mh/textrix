import isNodeActive from '../../helpers/isNodeActive';
import toggleNode from '../../commands/toggleNode';
import type { Command } from 'prosemirror-state';
import { Feature } from '../../Feature';
import { textblockTypeInputRule } from '../../inputRules';
import { isSelectionNotInsideNodeType } from '../../commands/isSelectionNotInsideNodeType';

declare module '../../types' {
  interface Commands {
    toggleH3: Command;
  }
}

/**
 * Matched `#` at the start of line to convert it to big title
 */
export const inputRule = /^#\s$/;

const H3 = Feature.create({
  name: 'h3',

  extendNodeSchema() {
    return {
      h3: {
        content: 'inline*',
        group: 'block',
        marks: '',
        parseDOM: [{ tag: 'h3' }],
        toDOM: ({ HTMLAttributes }) => ['h3', HTMLAttributes, 0],
      },
    };
  },

  addBubbleMenuItems() {
    return [
      {
        name: this.name,
        type: 'text',
        priority: 700,
        isActive: (state) => isNodeActive(state, this.schema.nodes.h3),
        execute: this.commands.toggleH3,
        isVisible: isSelectionNotInsideNodeType(this.schema.nodes.figcaption),
        icon: this.editor.options.icons.tBigger,
        title: this.editor.options.messages.bigTitle,
      },
    ];
  },

  addCommands() {
    return {
      toggleH3: toggleNode(this.schema.nodes.h3, this.schema.nodes.paragraph),
    };
  },

  addKeyboardShortcuts() {
    return { 'Mod-Alt-1': this.commands.toggleH3 };
  },

  addInputRules() {
    if (this.editor.options.markdownShortcuts) {
      return [textblockTypeInputRule({ find: inputRule, type: this.schema.nodes.h3 })];
    }

    return [];
  },
});

export default H3;
