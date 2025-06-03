import { isMarkActive } from '../../helpers/isMarkActive';
import canSetMark from '../../commands/canSetMark';
import toggleMark from '../../commands/toggleMark';
import type { Command } from 'prosemirror-state';
import { Feature } from '../../Feature';
import { markInputRule } from '../../inputRules';
import { markPasteRule } from '../../pasteRules';

declare module '../../types' {
  interface Commands {
    toggleBold: Command;
  }
}

/**
 * Matches bold text via `**` as input.
 */
export const starInputRegex = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/;

/**
 * Matches bold text via `**` while pasting.
 */
export const starPasteRegex = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))/g;

/**
 * Matches bold text via `__` as input.
 */
export const underscoreInputRegex = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))$/;

/**
 * Matches bold text via `__` while pasting.
 */
export const underscorePasteRegex = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))/g;

const Bold = Feature.create({
  name: 'bold',

  extendMarkSchema() {
    return {
      bold: {
        parseDOM: [
          { tag: 'strong' },
          {
            tag: 'b',
            getAttrs: (node) => node.style.fontWeight !== 'normal' && null,
          },
          {
            style: 'font-weight',
            getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null,
          },
        ],
        toDOM: () => ['strong', 0],
      },
    };
  },

  addBubbleMenuItems() {
    return [
      {
        name: this.name,
        type: 'text',
        priority: 1000,
        isActive: (state) => isMarkActive(state, this.schema.marks.bold),
        canActivate: (state) => canSetMark(state, this.schema.marks.bold),
        execute: this.commands.toggleBold,
        title: this.editor.options.messages.bold,
      },
    ];
  },

  addCommands() {
    return {
      toggleBold: toggleMark(this.schema.marks.bold),
    };
  },

  addKeyboardShortcuts() {
    return { 'Mod-b': this.commands.toggleBold };
  },

  addInputRules() {
    if (this.editor.options.markdownShortcuts) {
      return [
        markInputRule({
          find: starInputRegex,
          type: this.schema.marks.bold,
        }),
        markInputRule({
          find: underscoreInputRegex,
          type: this.schema.marks.bold,
        }),
      ];
    }
    return [];
  },

  addPasteRules() {
    if (this.editor.options.markdownShortcuts) {
      return [
        markPasteRule({
          find: starPasteRegex,
          type: this.schema.marks.bold,
        }),
        markPasteRule({
          find: underscorePasteRegex,
          type: this.schema.marks.bold,
        }),
      ];
    }
    return [];
  },
});
export default Bold;
