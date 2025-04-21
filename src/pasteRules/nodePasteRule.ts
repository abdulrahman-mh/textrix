import type { NodeType, Node as ProseMirrorNode } from 'prosemirror-model';

import { PasteRule, type PasteRuleFinder } from '../PasteRule';
import type { ExtendedRegExpMatchArray } from '../types';
import { callOrReturn } from '../helpers/callOrReturn';

/**
 * Build an paste rule that adds a node when the
 * matched text is pasted into it.
 * @see https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#paste-rules
 */
export function nodePasteRule(config: {
  find: PasteRuleFinder;
  type: NodeType;
  getAttributes?:
    | Record<string, any>
    | ((match: ExtendedRegExpMatchArray, event: ClipboardEvent) => Record<string, any>)
    | false
    | null;
  getContent?: ProseMirrorNode | ((attrs: Record<string, any>) => ProseMirrorNode) | false | null;
}) {
  return new PasteRule({
    find: config.find,
    handler({ match, state, range, pasteEvent }) {
      const attributes = callOrReturn(config.getAttributes, undefined, match, pasteEvent);

      if (!attributes) {
        return null;
      }

      const content = callOrReturn(config.getContent, undefined, attributes) || [];

      const { tr } = state;

      if (match.input) {
        tr.delete(range.from, range.to).insert(range.from, state.schema.node(config.type, attributes, content));
      }
    },
  });
}
