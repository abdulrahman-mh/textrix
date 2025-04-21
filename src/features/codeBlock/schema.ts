import type { NodeExtendedSpec, SchemaOptions } from '../../types';
import { languagesMapping } from './languages';
import { hljs, isLanguageRegistered, registered } from './codeHighlightPlugin';

function parseHighlightedNodes(nodes: any) {
  return nodes.map((node: any) => {
    if (node.type === 'text') {
      return node.value;
    }

    if (node.type === 'element') {
      return [node.tagName, { class: node.properties.className.join(' ') }, ...parseHighlightedNodes(node.children)];
    }
  });
}

export function schema(options: SchemaOptions): Record<string, NodeExtendedSpec> {
  return {
    codeBlock: {
      content: 'text*',
      group: 'block',
      marks: '',
      code: true,
      defining: true,

      attrs: {
        language: { default: null },
        mode: { default: 1 }, // 0 None, 1 Auto, 2 Explicity
      },

      parseDOM: [
        {
          tag: 'pre',
          preserveWhitespace: 'full',
          getAttrs: (dom: HTMLElement) => ({
            language: dom.getAttribute('data-code-block-lang'),
            mode: dom.getAttribute('data-code-block-mode'),
          }),
        },
      ],

      toDOM: ({ HTMLAttributes, node }) => {
        const { mode, language, ...otherAttributes } = HTMLAttributes;

        // If published, only return the <pre>
        if (options.published) {
          if (Number(mode) === 0) return ['pre', 0];

          let code: any;
          if (Number(mode) === 1) {
            code = hljs.highlightAuto(node.textContent, registered);
          } else if (Number(mode) === 2 && language && isLanguageRegistered(language)) {
            code = hljs.highlight(node.textContent, { language, ignoreIllegals: true });
          } else {
            // Fallback
            code = hljs.highlightAuto(node.textContent, registered);
          }

          return ['pre', ...parseHighlightedNodes(code._emitter.root.children)];
        }

        const codeMenu = document.createElement('div');
        // codeMenu.setAttribute('contenteditable', 'false');
        codeMenu.setAttribute('class', 'codeBlockMenu-button');

        const langText = languagesMapping[language] || 'typescript';
        const content = Number(mode) === 0 ? 'None' : Number(mode) === 1 ? `Auto (${langText})` : langText;
        codeMenu.innerText = content;

        const icon = document.createElement('span');
        icon.className = 'svgIcon svgIcon--19px';
        icon.innerHTML =
          '<svg class="svgIcon-use" width="19" height="19" viewBox="0 0 24 24" fill="none"><g clip-path="url(#clip0_1082_12841)"><path d="M8.354 9.646a.5.5 0 10-.708.708l.708-.708zM12 14l-.354.354a.5.5 0 00.708 0L12 14zm4.354-3.646a.5.5 0 00-.708-.708l.708.708zm-8.708 0l4 4 .708-.708-4-4-.708.708zm4.708 4l4-4-.708-.708-4 4 .708.708z" fill="currentColor"></path></g></svg>';
        codeMenu.appendChild(icon);

        return [
          'pre',
          {
            spellcheck: false,
            'data-code-block-mode': mode,
            'data-code-block-lang': mode !== 0 ? language : null,
            ...otherAttributes,
          },
          ['code', 0],
          codeMenu,
        ];
      },
    },
  };
}
