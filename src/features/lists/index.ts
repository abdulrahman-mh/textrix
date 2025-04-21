import { Feature } from '../../Feature';
import { wrappingInputRule } from '../../inputRules';

/**
 * Matches an ordered list to a 1. on input (or any number followed by a dot).
 */
export const orderedInputRegex = /^(\d+)\.\s$/;

/**
 * Matches a bullet list to a dash or asterisk.
 */
export const bulletInputRegex = /^\s*([-+*])\s$/;

const Lists = Feature.create({
  name: 'lists',

  extendNodeSchema() {
    return {
      listItem: {
        content: 'paragraph (orderedList | bulletList)*',
        defining: true,
        parseDOM: [{ tag: 'li' }],
        toDOM: () => ['li', 0],
      },

      bulletList: {
        group: 'block list',
        content: 'listItem+',
        parseDOM: [{ tag: 'ul' }],
        toDOM: () => ['ul', 0],
      },

      orderedList: {
        group: 'block list',
        content: 'listItem+',
        attrs: { start: { default: 1 } },
        parseDOM: [
          {
            tag: 'ol',
            getAttrs: (dom: HTMLElement) => ({
              start: dom.hasAttribute('start') ? Number.parseInt(dom.getAttribute('start') || '', 10) : 1,
            }),
          },
        ],
        toDOM: ({ HTMLAttributes }) => ['ol', HTMLAttributes, 0],
      },
    };
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: orderedInputRegex,
        type: this.schema.nodes.orderedList,
        getAttributes: (match) => ({ start: +match[1] }),
        joinPredicate: (match, node) => node.childCount + node.attrs.start === +match[1],
      }),

      wrappingInputRule({ find: bulletInputRegex, type: this.schema.nodes.bulletList }),
    ];
  },
});

export default Lists;
