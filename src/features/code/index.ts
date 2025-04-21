import { Feature } from '../../Feature';
import { markInputRule } from '../../inputRules';
import { markPasteRule } from '../../pasteRules';

/**
 * Regular expressions to match inline code blocks enclosed in backticks.
 *  It matches:
 *     - An opening backtick, followed by
 *     - Any text that doesn't include a backtick (captured for marking), followed by
 *     - A closing backtick.
 *  This ensures that any text between backticks is formatted as code,
 *  regardless of the surrounding characters (exception being another backtick).
 */
export const inputRegex = /(^|[^`])`([^`]+)`(?!`)/;

/**
 * Matches inline code while pasting.
 */
export const pasteRegex = /(^|[^`])`([^`]+)`(?!`)/g;

const Code = Feature.create({
  name: 'code',

  extendMarkSchema() {
    return {
      code: {
        excludes: '_',
        code: true,
        exitable: true,
        parseDOM: [{ tag: 'code' }],
        toDOM: () => ['code', 0],
      },
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.schema.marks.code,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: pasteRegex,
        type: this.schema.marks.code,
      }),
    ];
  },
});

export default Code;
