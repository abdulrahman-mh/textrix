import { isMarkActive } from '../../helpers/isMarkActive';
import canSetMark from '../../commands/canSetMark';
import { sanitizeHref } from './sanitizeUri';
import { Feature } from '../../Feature';
import type { Command } from 'prosemirror-state';
import autolink from './autolink';
import { markPasteRule } from '../../pasteRules';
import type { PasteRuleMatch } from '../../PasteRule';
import { find } from 'linkifyjs';

declare module '../../types' {
  interface Commands {
    toggleLink: Command;
  }
}

export const pasteRegex =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)/gi;

const Link = Feature.create({
  name: 'link',

  priority: 200,

  extendMarkSchema() {
    return {
      link: {
        inclusive: false,

        attrs: {
          href: { default: null },
          target: { default: null },
          rel: { default: null },
          class: { default: null },
        },

        parseDOM: [
          {
            // TODO: Give it lower priority then mention
            tag: 'a[href]',
            getAttrs(dom: HTMLElement) {
              const href = sanitizeHref(dom.getAttribute('href'));

              // prevent XSS attacks
              if (!href) return false;
              return { href };
            },
          },
        ],

        toDOM: ({ HTMLAttributes }) => {
          const href = sanitizeHref(HTMLAttributes.href);

          // prevent XSS attacks
          if (!href) {
            // strip out the href
            return ['a', { ...HTMLAttributes, href: '' }, 0];
          }

          return ['a', { ...HTMLAttributes, href }, 0];
        },
      },
    };
  },

  addBubbleMenuItems() {
    return [
      {
        name: this.name,
        type: 'text',
        priority: 800,
        isActive: (state) => isMarkActive(state, this.schema.marks.link, {}, false),
        canActivate: (state) => canSetMark(state, this.schema.marks.link),
        icon: this.editor.options.icons.link,
        title: this.editor.options.messages.link,
        divider: true,
      },
    ];
  },

  addPopoversRules() {
    return [
      {
        className: 'link dark',
        find: (target) => {
          return Boolean(target.dataset.tooltip);
        },
        content(target) {
          const href = target.dataset.tooltip!;
          const link = document.createElement('a');
          link.href = href;
          link.target = '_blank';
          link.textContent = href;
          return link;
        },
      },
    ];
  },

  addCommands() {
    return {
      // TODO: Click on link cancel button if visible
      toggleLink: () => {
        const button = document.querySelector('button[data-action="link"]') as HTMLButtonElement;
        if (button) {
          const rect = button.getBoundingClientRect();

          button.dispatchEvent(
            new MouseEvent('mouseup', {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            }),
          );
        }
        return true;
      },
    };
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: (text) => {
          const foundLinks: PasteRuleMatch[] = [];

          if (text) {
            const links = find(text).filter((item) => item.isLink && /^https?:\/\//.test(item.href));

            if (links.length) {
              for (const link of links) {
                foundLinks.push({
                  text: link.value,
                  data: {
                    href: link.href,
                  },
                  index: link.start,
                });
              }
            }
          }

          return foundLinks;
        },
        type: this.schema.marks.link,
        getAttributes: (match) => {
          return {
            href: match.data?.href,
          };
        },
      }),
    ];
  },

  addPlugins() {
    return [autolink];
  },

  addKeyboardShortcuts() {
    return { 'Mod-k': this.commands.toggleLink };
  },
});

export default Link;
