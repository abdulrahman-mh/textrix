import type { Command } from 'prosemirror-state';
import { Feature, type Menuitem } from '../../Feature';
import dragHandlerPlugin from './dragHandlerPlugin';
import {
  applyMediaLayout,
  canApplyMediaLayout,
  isMediaLayoutActive,
  newLineInMedia,
  type MediaLayout,
} from './helpers';
import { extendNodeSchema } from './schema';
import { urlEmbedInputRule } from './urlEmbedInputRule';
import type { EmbedMedia } from '../../types';
import { insertFigcaptionPlugin } from './insertFigcaptionPlugin';

declare module '../../types' {
  interface Commands {
    setEmbedPlaceholder: (options: {
      message: string;
      className?: string;
    }) => Command;
    newLineInMedia: Command;
  }
}

export interface MediaOptions {
  /**
   * Uploads an image file and returns its URL.
   * @param file - The image file to upload.
   * @returns A promise with the image URL and optional ID.
   *
   * @example
   * uploadImage: async ({ file }) => {
   *   const imageUrl = uploadToMyCDN(file)
   *   return { url: imageUrl };
   * }
   */
  uploadImage?: ({
    file,
  }: {
    file: File;
  }) => Promise<{ url: string; imageId?: string } | null | undefined>;

  /**
   * handle embedded content requests
   *
   * @param url - The URL of the media to embed.
   * @returns An object containing the media metadata.
   *
   * @example
   * fetchMediaEmbedData: ({ url }) => {
   *   return { mediaId: 'abc123', iframeSrc: url, title: 'Video title' };
   * }
   */
  fetchMediaEmbedData?: ({
    url,
  }: {
    url: string;
  }) => Promise<EmbedMedia | undefined | null>;

  /**
   * Generates an optimized image URL based on the given layout.
   *
   * @param {Object} params - Parameters for image optimization.
   * @param {string} params.src - Original image source URL.
   * @param {MediaLayout} [params.layout] - Desired layout type. One of:
   *  - "inset-center"
   *  - "outset-center"
   *  - "fill-width"
   *  - "grid"
   *
   * @returns {string | null | undefined} The optimized image URL, or null/undefined if invalid.
   *
   * @example
   * getOptimizedImageUrl: ({ src, layout }) => {
   *   const layoutWidths: Record<MediaLayout, number> = {
   *     "grid": 500,
   *     "inset-center": 800,
   *     "outset-center": 1200,
   *     "fill-width": 5000,
   *   };
   *
   *   const width = layout ? layoutWidths[layout] : 1000; // Fallback width
   *   const imageUrl = new URL(src);
   *   imageUrl.searchParams.set("width", `${width}px`);
   *
   *   return imageUrl.toString();
   * }
   */
  getOptimizedImageUrl?: (params: {
    src: string;
    layout?: MediaLayout;
  }) => string | null | undefined;

  /**
   * Maximum allowed image file size in bytes.
   * Triggers `onMaxFileSizeError` if exceeded.
   * @default 26214400 // 25mb
   */
  maxImageSizeBytes?: number;

  /**
   * Called when a file exceeds the maximum size limit.
   * @param file - The oversized file.
   */
  onMaxFileSizeError?: (file: File) => void;

  /**
   * Vertical margin to trigger scrolling to media
   * @default 0
   */
  mediaFocusOffset?: number;
}

type MediaStorage = Pick<MediaOptions, 'mediaFocusOffset' | 'uploadImage' | 'getOptimizedImageUrl'>;

export const Media = Feature.create<MediaOptions, MediaStorage>({
  name: 'media',

  addOptions() {
    return {
      mediaFocusOffset: 0,
      maxImageSizeBytes: 25 * 1024 * 1024,
    };
  },
  addStorage() {
    return {
      mediaFocusOffset: this.options.mediaFocusOffset,
      uploadImage: this.options.uploadImage,
      getOptimizedImageUrl: this.options.getOptimizedImageUrl,
    };
  },

  addCommands() {
    return {
      setEmbedPlaceholder:
        ({ message, className }) =>
        (state, dispatch) => {
          if (dispatch) {
            dispatch(
              state.tr.setMeta('addPlaceholder', {
                pos: state.selection.from - 1,
                message,
                className,
                removeOnAnyTr: true,
              }),
            );
          }
          return true;
        },
      newLineInMedia,
    };
  },

  extendNodeSchema() {
    return extendNodeSchema(this);
  },

  addPlugins() {
    return [dragHandlerPlugin(), insertFigcaptionPlugin()];
  },

  addFloatingMenuItems() {
    return [
      {
        name: 'image',
        priority: 900,
        title: this.editor.options.messages.addImage,
      },
      {
        name: 'video',
        priority: 700,
        title: this.editor.options.messages.addVideo,
        execute: this.commands.setEmbedPlaceholder({
          message: this.editor.options.messages.videoUrl,
        }),
      },
      {
        priority: 600,
        name: 'embed',
        title: this.editor.options.messages.addEmbed,
        execute: this.commands.setEmbedPlaceholder({
          message: this.editor.options.messages.embedUrl,
        }),
      },
    ];
  },

  addBubbleMenuItems(): Menuitem[] {
    return [
      {
        type: 'media',
        name: 'inset-center',
        isActive: (state) => isMediaLayoutActive(state, 'inset-center'),
        execute: applyMediaLayout('inset-center', this.editor),
        title: this.editor.options.messages.mediaInset,
      },
      {
        type: 'media',
        name: 'outset-center',
        isActive: (state) => isMediaLayoutActive(state, 'outset-center'),
        isVisible: (state) => canApplyMediaLayout(state, 'outset-center'),
        execute: applyMediaLayout('outset-center', this.editor),
        title: this.editor.options.messages.mediaOutset,
      },
      {
        type: 'media',
        name: 'fill-width',
        isActive: (state) => isMediaLayoutActive(state, 'fill-width'),
        isVisible: (state) => canApplyMediaLayout(state, 'fill-width'),
        execute: applyMediaLayout('fill-width', this.editor),
        title: this.editor.options.messages.mediaFill,
      },
      // {
      //   action: 'alt',
      //   isActive: (state) => isImageHaveAlt(state),
      //   isVisible: (state) => isImageSelection(state),
      //   execute: (state, dispatch) => {
      //     const { selection } = state;

      //     if (selection instanceof NodeSelection) {
      //       const node = selection.node;

      //       if (isImageHaveAlt(state)) {
      //         const tr = state.tr.setNodeMarkup(state.selection.from, undefined, {
      //           ...node.attrs,
      //           alt: undefined,
      //         });

      //         if (dispatch) {
      //           dispatch(tr);
      //         }
      //       } else {
      //         // options.onSetAltText({ name: node.attrs.name, backgroundURI: '' });
      //       }
      //     }
      //   },
      //   content: `<span class="button-label">${options.messages.altTextButton}</span>`,
      //   title: options.messages.altDescription,
      //   dividerBefore: true,
      // },
    ];
  },

  addInputRules() {
    if (this.options.fetchMediaEmbedData) {
      return [urlEmbedInputRule(this.editor, this.options.fetchMediaEmbedData, this.view)];
    }
    return [];
  },
});
