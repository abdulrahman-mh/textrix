import { setBlockType } from 'prosemirror-commands';
import toggleNode from '../../commands/toggleNode';
import { Feature } from '../../Feature';
import { schema } from './schema';
import type { Command } from 'prosemirror-state';
import { exitCodeOnArrowDown } from './exitCode';
import { textblockTypeInputRule } from '../../inputRules';
import { codeHighlightPlugin } from './codeHighlightPlugin';
import { languagesMenuPlugin } from './languagesMenuPlugin';

declare module '../../types' {
  interface Commands {
    tabInCode: Command;
    setCodeBlock: Command;
    toggleCodeBlock: Command;
  }
}

export const CodeBlock = Feature.create({
  name: 'codeBlock',

  extendNodeSchema() {
    return schema(this.schemaOptions);
  },

  addFloatingMenuItems() {
    return [
      {
        name: 'codeBlock',
        priority: 500,
        title: this.editor.options.messages.codeBlock,
        execute: this.commands.setCodeBlock,
      },
    ];
  },

  addPlugins() {
    return [codeHighlightPlugin, languagesMenuPlugin(this.editor)];
  },

  addCommands() {
    return {
      tabInCode: (state, dispatch) => {
        if (state.selection.$head.parent.type.spec.code) {
          if (dispatch) dispatch(state.tr.insertText('  ').scrollIntoView());
          return true;
        }
        return false;
      },
      setCodeBlock: setBlockType(this.schema.nodes.codeBlock),
      toggleCodeBlock: toggleNode(this.schema.nodes.codeBlock, this.schema.nodes.paragraph),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-6': this.commands.toggleCodeBlock,
      ArrowDown: exitCodeOnArrowDown,
    };
  },

  addInputRules() {
    return [
      /**
       * TODO: we can set the language with input rule
       * Code Block: Matches triple backticks
       */
      textblockTypeInputRule({ find: /^```$/, type: this.schema.nodes.codeBlock }),
    ];
  },
});
