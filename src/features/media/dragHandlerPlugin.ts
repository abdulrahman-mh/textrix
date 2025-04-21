import { Plugin, PluginKey, type Transaction } from 'prosemirror-state';
import { DragHandler } from './dragHandler';
import { combineTransactionSteps } from '../../helpers/combineTransactionSteps';
import { getChangedRanges } from '../../helpers/getChangedRanges';
import { findChildrenInRange } from '../../helpers/findNodes';
import { getDistributedWidth, resetFigureNode } from './helpers';
import type { NodeWithPos } from '../../types';

export default function dragHandlerPlugin() {
  return new Plugin({
    key: new PluginKey('dragHandler'),
    view: (view) => new DragHandler(view),
    appendTransaction: (trs, { doc: oldDoc }, { doc: newDoc, tr }) => {
      const canProcess =
        trs.some((tr) => tr.docChanged) && !oldDoc.eq(newDoc) && !trs.some((tr) => tr.getMeta('preventFiguresChecks'));

      if (!canProcess) return null;

      const transform = combineTransactionSteps(oldDoc, trs as Transaction[]);

      for (const { newRange } of getChangedRanges(transform)) {
        const newNodes = findChildrenInRange(newDoc, newRange, (node) =>
          ['imagesGrid', 'figure'].includes(node.type.name),
        );

        for (const { node, pos } of newNodes) {
          const mappedPos = tr.mapping.map(pos);

          if (node.type.name === 'figure') {
            const imageNode = node.firstChild!;

            // Delete figure if it lacks a valid source
            if (!imageNode?.attrs.src) {
              try {
                tr.delete(mappedPos, mappedPos + node.nodeSize);
              } catch {}
            }

            // Ensure the figure is inside an imagesGrid if it has grid layout
            if (imageNode.attrs.layout === 'grid') {
              const resolvedPos = newDoc.resolve(mappedPos);
              const parent = resolvedPos.node(1);
              if (!parent || parent.type.name !== 'imagesGrid') {
                tr.replaceWith(mappedPos, mappedPos + node.nodeSize, resetFigureNode(node));
              }
            }
          }

          if (node.type.name === 'imagesGrid') {
            const mappedPos = tr.mapping.map(pos);

            // Remove empty grid
            if (node.childCount === 0) {
              tr.delete(mappedPos, mappedPos + node.nodeSize);
              continue;
            }

            // If only one child, unwrap it from the grid
            if (node.childCount === 1) {
              const figure = node.firstChild!;
              tr.replaceWith(mappedPos, mappedPos + node.nodeSize, resetFigureNode(figure));
              continue;
            }

            // If multiple children, reset figure widths
            let totalAspectRatio = 0;
            const figures: NodeWithPos[] = [];

            node.content.forEach((figureNode, offset) => {
              const imageNode = figureNode.firstChild;
              if (!imageNode) return;

              const { width, height } = imageNode.attrs;
              if (width && height) {
                totalAspectRatio += width / height;
                figures.push({
                  node: figureNode,
                  pos: mappedPos + offset + 1,
                });
              }
            });

            // Distribute width evenly based on aspect ratios
            for (const { node, pos } of figures) {
              const image = node.firstChild!;
              const { width, height } = image.attrs;

              const figureWidth = getDistributedWidth(width, height, totalAspectRatio, figures.length);

              tr.setNodeMarkup(pos, undefined, { ...node.attrs, width: figureWidth });
              tr.setNodeMarkup(pos + 1, undefined, { ...image.attrs, layout: 'grid' });
            }
          }
        }
      }

      return transform.steps.length ? tr : null;
    },
  });
}
