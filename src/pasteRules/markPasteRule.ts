import type { MarkType } from 'prosemirror-model';
import { callOrReturn } from '../helpers/callOrReturn';
import { getMarksBetween } from '../helpers/getMarksBetween';
import { PasteRule, type PasteRuleFinder } from '../PasteRule';
import type { ExtendedRegExpMatchArray } from '../types';

/**
 * Build paste rule that adds a mark when the
 * matched text is pasted into it.
 * @see https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#paste-rules
 */
export function markPasteRule(config: {
  find: PasteRuleFinder;
  type: MarkType;
  getAttributes?:
    | Record<string, any>
    | ((match: ExtendedRegExpMatchArray, event: ClipboardEvent) => Record<string, any>)
    | false
    | null;
}) {
  return new PasteRule({
    find: config.find,
    handler: ({ state, range, match, pasteEvent }) => {
      const attributes = callOrReturn(config.getAttributes, undefined, match, pasteEvent);

      if (attributes === false || attributes === null) {
        return null;
      }

      const { tr } = state;
      const captureGroup = match[match.length - 1];
      const fullMatch = match[0];
      let markEnd = range.to;

      if (captureGroup) {
        const startSpaces = fullMatch.search(/\S/);
        const textStart = range.from + fullMatch.indexOf(captureGroup);
        const textEnd = textStart + captureGroup.length;

        const excludedMarks = getMarksBetween(range.from, range.to, state.doc)
          .filter((item) => {
            // @ts-ignore
            const excluded = item.mark.type.excluded as MarkType[];

            return excluded.find((type) => type === config.type && type !== item.mark.type);
          })
          .filter((item) => item.to > textStart);

        if (excludedMarks.length) {
          return null;
        }

        if (textEnd < range.to) {
          tr.delete(textEnd, range.to);
        }

        if (textStart > range.from) {
          tr.delete(range.from + startSpaces, textStart);
        }

        markEnd = range.from + startSpaces + captureGroup.length;

        tr.addMark(range.from + startSpaces, markEnd, config.type.create(attributes || {}));

        tr.removeStoredMark(config.type);
      }
    },
  });
}
