import type { NodeExtendedSpec, SchemaOptions } from '../../types';

export function extendNodeSchema({
  name,
  options,
}: { name: string; options: SchemaOptions }): Record<string, NodeExtendedSpec> {
  return {
    doc: { content: 'block+' },

    text: { group: 'inline' },

    paragraph: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM: ({ HTMLAttributes }) => ['p', HTMLAttributes, 0],
    },
  };
}
