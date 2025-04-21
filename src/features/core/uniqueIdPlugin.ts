import { Plugin, PluginKey, type Transaction } from 'prosemirror-state';
import { combineTransactionSteps } from '../../helpers/combineTransactionSteps';
import { getChangedRanges } from '../../helpers/getChangedRanges';
import { findChildrenInRange } from '../../helpers/findNodes';

export const uniqueIdTypes = ['paragraph', 'h3', 'h4', 'blockquote', 'pullquote', 'codeBlock', 'image', 'iframe'];

export const generateID = () => Math.random().toString(36).slice(2, 11);

export function findDuplicates(items: any[]): any[] {
  const filtered = items.filter((el, index) => items.indexOf(el) !== index);

  return Array.from(new Set(filtered));
}

export function uniqueIdPlugin() {
  return new Plugin({
    key: new PluginKey('uniqueId'),
    appendTransaction: (trs, { doc: oldDoc }, { doc: newDoc, tr }) => {
      if (!trs.some((tr) => !!tr.docChanged) || oldDoc.eq(newDoc)) return;

      const transform = combineTransactionSteps(oldDoc, trs as Transaction[]);

      for (const { newRange } of getChangedRanges(transform)) {
        const newNodes = findChildrenInRange(newDoc, newRange, (node) => uniqueIdTypes.includes(node.type.name));

        const newIds = newNodes.map(({ node }) => node.attrs.name).filter((item) => !!item);

        for (const { node, pos } of newNodes) {
          const uniqueId = node.attrs.name;

          if (!uniqueId) {
            tr.setNodeAttribute(pos, 'name', generateID());
            continue;
          }

          if (tr.mapping.invert().mapResult(pos) && findDuplicates(newIds).includes(uniqueId))
            tr.setNodeAttribute(pos, 'name', generateID());
        }
      }

      if (!transform.steps.length) return null;

      return tr;
    },
  });
}
