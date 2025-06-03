import { isMarkActive } from '../../helpers/isMarkActive';
import canSetMark from '../../commands/canSetMark';
import toggleMark from '../../commands/toggleMark';
import type { Command } from 'prosemirror-state';
import { Feature } from '../../Feature';
import { markInputRule } from '../../inputRules';
import { markPasteRule } from '../../pasteRules';

declare module '../../types' {
  interface Commands {
    toggleItalic: Command;
  }
}

/**
 * Matches an italic to a *italic* on input.
 */
export const starInputRegex = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))$/;

/**
 * Matches an italic to a *italic* on paste.
 */
export const starPasteRegex = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))/g;

/**
 * Matches an italic to a _italic_ on input.
 */
export const underscoreInputRegex = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))$/;

/**
 * Matches an italic to a _italic_ on paste.
 */
export const underscorePasteRegex = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))/g;

const Italic = Feature.create({
  name: 'italic',

  extendMarkSchema() {
    return {
      italic: {
        parseDOM: [
          {
            tag: 'em',
          },
          {
            tag: 'i',
            getAttrs: (node) => (node as HTMLElement).style.fontStyle !== 'normal' && null,
          },
          {
            style: 'font-style=normal',
            clearMark: (mark) => mark.type.name === this.name,
          },
          {
            style: 'font-style=italic',
          },
        ],
        toDOM: () => ['em', 0],
      },
    };
  },

  addBubbleMenuItems() {
    return [
      {
        name: this.name,
        type: 'text',
        priority: 900,
        isActive: (state) => isMarkActive(state, this.schema.marks.italic),
        canActivate: (state) => canSetMark(state, this.schema.marks.italic),
        execute: this.commands.toggleItalic,
        title: this.editor.options.messages.italic,
      },
    ];
  },

  addCommands() {
    return {
      toggleItalic: toggleMark(this.schema.marks.italic),
    };
  },

  addKeyboardShortcuts() {
    return { 'Mod-i': this.commands.toggleItalic };
  },

  addInputRules() {
    if (this.editor.options.markdownShortcuts) {
      return [
        markInputRule({
          find: starInputRegex,
          type: this.schema.marks.italic,
        }),
        markInputRule({
          find: underscoreInputRegex,
          type: this.schema.marks.italic,
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
          type: this.schema.marks.italic,
        }),
        markPasteRule({
          find: underscorePasteRegex,
          type: this.schema.marks.italic,
        }),
      ];
    }

    return [];
  },
});

export default Italic;
