import { DOMSerializer, type Node, type Schema } from 'prosemirror-model';
import { createHTMLDocument, type VHTMLDocument } from 'zeed-dom';

/**
 * Returns the HTML string representation of a given document node.
 *
 * @param doc - The document node to serialize.
 * @param schema - The Prosemirror schema to use for serialization.
 * @returns The HTML string representation of the document fragment.
 *
 * @example
 * ```typescript
 * const html = getHTMLFromFragment(doc, schema)
 * ```
 */
export function getHTMLFromFragment(doc: Node, schema: Schema, options?: { document?: Document }): string {
  if (options?.document) {
    // The caller is relying on their own document implementation. Use this
    // instead of the default zeed-dom.
    const wrap = options.document.createElement('div');

    DOMSerializer.fromSchema(schema).serializeFragment(doc.content, { document: options.document }, wrap);
    return wrap.innerHTML;
  }

  // Use zeed-dom for serialization.
  const zeedDocument = DOMSerializer.fromSchema(schema).serializeFragment(doc.content, {
    document: createHTMLDocument() as unknown as Document,
  }) as unknown as VHTMLDocument;

  return zeedDocument.render();
}

// Instead of mutate the real ProseMirror doc, we mutate the HTML
// export function getHTMLFromFragment(
//   doc: Node,
//   schema: Schema,
//   headlinePositions?: Record<string, number>,
//   options?: { document?: Document }
// ): string {
//   if (options?.document) {
//     const wrap = options.document.createElement('div');
//     DOMSerializer.fromSchema(schema).serializeFragment(doc.content, { document: options.document }, wrap);

//     if (headlinePositions) {
//       applyHeadlineClasses(wrap, headlinePositions);
//     }

//     return wrap.innerHTML;
//   }

//   const zeedDocument = DOMSerializer.fromSchema(schema).serializeFragment(doc.content, {
//     document: createHTMLDocument() as unknown as Document,
//   }) as unknown as VHTMLDocument;

//   const container = createHTMLDocument().createElement('div');
//   container.appendChild(zeedDocument);

//   if (headlinePositions) {
//     applyHeadlineClasses(container, headlinePositions);
//   }

//   return container.innerHTML;
// }
