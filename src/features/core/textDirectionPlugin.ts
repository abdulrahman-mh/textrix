import { Plugin, PluginKey, type Transaction } from 'prosemirror-state';
import { combineTransactionSteps } from '../../helpers/combineTransactionSteps';
import { getChangedRanges } from '../../helpers/getChangedRanges';
import { findChildrenInRange } from '../../helpers/findNodes';

// FROM Lexical
// - https://github.com/facebook/lexical/blob/main/packages/lexical/src/LexicalConstants.ts

const RTL = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';
const LTR =
  'A-Za-z\u00C0-\u00D6\u00D8-\u00F6' +
  '\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C' +
  '\uFE00-\uFE6F\uFEFD-\uFFFF';

const RTL_REGEX = new RegExp(`^[^${LTR}]*[${RTL}]`);
const LTR_REGEX = new RegExp(`^[^${RTL}]*[${LTR}]`);

export function getTextDirection(text: string): 'ltr' | 'rtl' | null {
  if (text.length === 0) {
    return null;
  }
  if (RTL_REGEX.test(text)) {
    return 'rtl';
  }
  if (LTR_REGEX.test(text)) {
    return 'ltr';
  }
  return null;
}

export const textDirectionTypes = ['h3', 'h4', 'paragraph'];

export function textDirectionPlugin() {
  return new Plugin({
    key: new PluginKey('textDirection'),
    appendTransaction: (trs, { doc: oldDoc }, { doc: newDoc, tr }) => {
      if (!trs.some((tr) => !!tr.docChanged) || oldDoc.eq(newDoc)) return;

      const transform = combineTransactionSteps(oldDoc, trs as Transaction[]);

      for (const { newRange } of getChangedRanges(transform)) {
        const newNodes = findChildrenInRange(newDoc, newRange, (node) => textDirectionTypes.includes(node.type.name));

        for (const { node, pos } of newNodes) {
          const dir = getTextDirection(node.textContent);
          if (dir !== node.attrs.dir) {
            tr.setNodeAttribute(pos, 'dir', dir);
          }
        }
      }

      return transform.steps.length ? tr : null;
    },
  });
}
