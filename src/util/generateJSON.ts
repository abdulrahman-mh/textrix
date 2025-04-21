import { DOMParser } from 'prosemirror-model';
import type { Schema } from 'prosemirror-model';
import { parseHTML } from 'zeed-dom';

/**
 * Converts an HTML string into a JSON document structure.
 *
 * @param {string} html - The HTML content to convert.
 * @param {Schema} schema - The schema defining the document structure.
 * @returns {Record<string, any>} - The generated JSON object.
 * @example
 * const html = '<p>Hello, world!</p>'
 * const schema = buildSchema()
 * const json = generateJSON(html, schema)
 * console.log(json) // { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello, world!' }] }] }
 */
export function generateJSON(html: string, schema: Schema): Record<string, any> {
  const dom = parseHTML(html) as unknown as Node;

  return DOMParser.fromSchema(schema).parse(dom).toJSON();
}
