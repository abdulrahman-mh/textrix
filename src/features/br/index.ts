import type { Command } from 'prosemirror-state';
import { Feature } from '../../Feature';
import { chainCommands, exitCode } from 'prosemirror-commands';

declare module '../../types' {
  interface Commands {
    setHardBreak: Command;
  }
}

const HardBreak = Feature.create({
  name: 'br',

  extendNodeSchema() {
    return {
      br: {
        inline: true,
        group: 'inline',
        selectable: false,
        linebreakReplacement: true,
        leafText: () => '\n',
        parseDOM: [{ tag: 'br' }],
        toDOM: () => ['br'],
      },
    };
  },

  addCommands() {
    return {
      setHardBreak: (state, dispatch) => {
        return dispatch?.(state.tr.replaceSelectionWith(this.schema.nodes.br.create())) ?? false;
      },
    };
  },

  addKeyboardShortcuts() {
    return { 'Shift-Enter': chainCommands(exitCode, this.commands.setHardBreak) };
  },
});

export default HardBreak;
