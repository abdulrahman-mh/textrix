import type { Schema } from 'prosemirror-model';
import type { TextSerializer } from '../types';

/**
 * Find text serializers `toText` in a Prosemirror schema
 * @param schema The Prosemirror schema to search in
 * @returns A record of text serializers by node name
 */
export function getTextSerializersFromSchema(schema: Schema): Record<string, TextSerializer> {
  return Object.fromEntries(
    Object.entries(schema.nodes)
      .filter(([, node]) => node.spec.toText)
      .map(([name, node]) => [name, node.spec.toText]),
  );
}
