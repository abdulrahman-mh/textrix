import { Node, type Schema } from 'prosemirror-model';
import type { GetHTMLOptions, JSONContent } from '../types';

import { getHTMLFromFragment } from './getHTMLFromFragment';
import { applyHeadlineClassesToNode } from '../helpers/applyHeadlineClasses';

/**
 * Generates published HTML from a JSON document.
 *
 * @param doc - The JSON document content.
 * @param schema - The built schema.
 * @returns The generated HTML.
 * @example
 * const doc = {
 *   type: 'doc',
 *   content: [
 *     {
 *       type: 'paragraph',
 *       content: [
 *         {
 *           type: 'text',
 *           text: 'Hello world!'
 *         }
 *       ]
 *     }
 *   ]
 * }
 * const schema = buildSchema()
 * const html = generateHTML(doc, schema)
 */
export function generateHTML(doc: JSONContent, schema: Schema, options?: GetHTMLOptions): string {
  let contentNode = Node.fromJSON(schema, doc);

  let prevNode: { node: Node; index: number } | null = null;
  let isDone = false;
  const headlinesPositions: Record<string, number> = {};

  // Resolve headline set
  contentNode.forEach((node, _, index) => {
    if (isDone) return;

    const name = node.type.name;
    if (name === 'paragraph' && node.textContent.trim() === '' && !prevNode) return;

    if (name === 'h3' && (!prevNode || prevNode.node.type.name !== 'h3')) {
      headlinesPositions.title = index;

      if (prevNode?.node.type.name === 'h4') {
        headlinesPositions.kicker = prevNode.index;
      }

      prevNode = { node, index };
    } else if (name === 'h4' && (!prevNode || prevNode.node.type.name !== 'h4')) {
      if (prevNode?.node.type.name === 'h3') {
        headlinesPositions.subtitle = index;
        isDone = true;
        return;
      }

      prevNode = { node, index };
    } else {
      isDone = true;
    }
  });

  if (options?.stripHeadlines) {
    const values = Object.values(headlinesPositions);

    if (values.length > 0) {
      // Filter out the identified headline nodes
      const filteredContent = contentNode.content.content.filter((_, index) => !values.includes(index));

      if (filteredContent.length === 0) {
        return `<div class="textrix"></div>`;
      }

      contentNode = schema.nodes.doc.create({}, filteredContent);
    }
  } else {
    applyHeadlineClassesToNode(contentNode, headlinesPositions);
  }

  const htmlContent = getHTMLFromFragment(contentNode, schema);

  return `<div class="textrix">${htmlContent}</div>`;
}
