import { find } from 'linkifyjs';
import type { Editor } from '../../Editor';
import { InputRule } from '../../InputRule';
import type { MediaOptions } from './';
import type { EditorView } from 'prosemirror-view';
import { findChildren } from '../../helpers/findNodes';

const types = ['paragraph', 'h3', 'h4'];

export const urlEmbedInputRule = (
  editor: Editor,
  fetchMedia: NonNullable<MediaOptions['fetchMediaEmbedData']>,
  view: EditorView,
) => {
  return new InputRule({
    find: /\n$/, // Matches an empty line
    handler: async ({ commands, match, range, state }) => {
      const { $from } = state.selection;
      const node = $from.nodeBefore;

      if (!node || types.includes(node.type.name)) return;

      const link = find(node.textContent, { defaultProtocol: '' }).find(
        (item) => item.isLink && item.value.trim() === node.textContent.trim() && /^https?:\/\//.test(item.value),
      );
      if (!link) return;

      try {
        const media = await fetchMedia({ url: node.textContent });
        if (!media) return;

        const { state, dispatch } = view;
        const { tr } = state;

        if (media.iframeSrc) {
          const graf = findChildren(
            state.doc,
            (n) =>
              n.type === node.type &&
              n.attrs.name === node.attrs.name &&
              n.textContent.trim() === node.textContent.trim(),
          )[0];

          if (!graf) return;

          const figure = state.schema.nodes.figure.create(
            null,
            state.schema.nodes.iframe.create({
              src: media.iframeSrc,
              frameborder: media.iframeAttr?.frameborder,
              allowfullscreen: media.iframeAttr?.allowfullscreen,
              width: media.iframeWidth,
              height: media.iframeHeight,
              mediaId: media.mediaId,
            }),
          );

          tr.replaceWith(graf.pos, graf.pos + graf.node.nodeSize, figure);
        } else {
          // TODO: Handle normal embed card
        }

        dispatch(tr);
      } catch (error) {
        console.error('Error fetching media:', error);
      }
    },
  });
};
