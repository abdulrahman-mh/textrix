import isNodeActive from '../../helpers/isNodeActive';
import type { Command } from 'prosemirror-state';
import { Feature } from '../../Feature';
import { chainIsActive, cycleNodes } from './cycleNodes';
import { textblockTypeInputRule, wrappingInputRule } from '../../inputRules';
import { isSelectionNotInsideNodeType } from '../../commands/isSelectionNotInsideNodeType';

declare module '../../types' {
  interface Commands {
    triggerCycleQuote: Command;
  }
}

/**
 * Matches a blockquote (`>` as input).
 */
export const blockquoteRegex = /^\s*>\s$/;

/**
 * Matches a pull quote (`>>` as input).
 */
export const pullquoteRegex = /^\s*>>\s$/;

const Quote = Feature.create({
  name: 'blockquote',

  extendNodeSchema() {
    return {
      blockquote: {
        content: 'inline*',
        group: 'block',
        defining: true,

        parseDOM: [
          {
            tag: 'blockquote',
            priority: 100,
          },
        ],
        toDOM: ({ HTMLAttributes }) => ['blockquote', { HTMLAttributes }, 0],
      },

      pullquote: {
        content: 'inline*',
        group: 'block',
        marks: 'link',
        defining: true,

        parseDOM: [
          {
            priority: 150,
            tag: 'blockquote.pullquote',
          },
        ],
        toDOM: ({ HTMLAttributes }) => ['blockquote', { class: 'pullquote', ...HTMLAttributes }, 0],
      },
    };
  },

  addBubbleMenuItems(this) {
    return [
      {
        name: this.name,
        type: 'text',
        priority: 500,
        isActive: chainIsActive(
          (state) => isNodeActive(state, this.schema.nodes.blockquote),
          (state) => isNodeActive(state, this.schema.nodes.pullquote),
        ),
        execute: this.commands.triggerCycleQuote,
        isVisible: isSelectionNotInsideNodeType(this.schema.nodes.figcaption),
        title: this.editor.options.messages.quote,
      },
    ];
  },

  addInputRules() {
    if (this.editor.options.markdownShortcuts) {
      return [
        // Blockquote
        textblockTypeInputRule({ find: blockquoteRegex, type: this.schema.nodes.blockquote }),
        // Pull Quote
        textblockTypeInputRule({ find: pullquoteRegex, type: this.schema.nodes.pullquote }),
      ];
    }

    return [];
  },

  addCommands() {
    return {
      triggerCycleQuote: (state, dispatch) => {
        const { blockquote, pullquote, paragraph } = state.schema.nodes;
        if (dispatch) cycleNodes(state, dispatch, [blockquote, pullquote, paragraph]);
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return { 'Mod-Alt-5': this.commands.triggerCycleQuote };
  },
});

export default Quote;
