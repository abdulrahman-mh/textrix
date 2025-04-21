import type { NodeExtendedSpec, SchemaOptions } from "../../types";
import { getAspectRatioLayout, getLayoutWidth } from "./helpers";

export function extendNodeSchema({
  name,
  schemaOptions,
}: {
  name: string;
  schemaOptions: SchemaOptions;
}): Record<string, NodeExtendedSpec> {
  return {
    figure: {
      group: "block",
      content: "(image | iframe) figcaption?",
      attrs: { width: { default: null } },
      draggable: true,
      isolating: true,

      parseDOM: [
        {
          tag: "figure",
          getAttrs: (dom: HTMLElement) => {
            const imageOrIframe = dom.querySelector("img, iframe");

            if (!imageOrIframe) {
              return false;
            }

            return null;
          },
        },
      ],

      toDOM({ HTMLAttributes }) {
        const { width, ...otherAttrs } = HTMLAttributes;

        return [
          "figure",
          {
            style: HTMLAttributes.width
              ? `width: ${HTMLAttributes.width}%`
              : null,
            ...otherAttrs,
          },
          0,
        ];
      },
    },

    figcaption: {
      content: "inline*",
      marks: "bold link",
      parseDOM: [{ tag: "figcaption" }],
      toDOM: () => ["figcaption", 0],
    },

    imagesGrid: {
      group: "block",
      content: "figure*",
      defining: true,
      isolating: true,

      parseDOM: [
        {
          tag: "div.images-grid",
        },
      ],
      toDOM() {
        return ["div", { class: "images-grid" }, 0];
      },
    },

    image: {
      attrs: {
        src: { default: null },
        zoomSrc: { default: null },
        alt: { default: null },
        title: { default: null },
        imageId: { default: null },
        width: { default: null },
        height: { default: null },
        layout: { default: "inset-center" },
      },

      parseDOM: [
        {
          // TODO: Add support for images blob data in src attribute
          tag: 'img[src]:not([src^="data:"])',
          getAttrs: (dom: HTMLElement) => {
            const src = dom.getAttribute("src");

            if (!src) return false;

            return {
              src,
              alt: dom.getAttribute("alt"),
              title: dom.getAttribute("title"),
              ...dom.dataset,
            };
          },
        },
      ],

      toDOM({ HTMLAttributes }) {
        const { imageId, width, height, layout, zoomSrc, ...otherAttrs } =
          HTMLAttributes;

        if (schemaOptions.published) {
          return [
            "img",
            { width, height, src: otherAttrs.src, "data-zoom-src": zoomSrc, 'data-layout': layout },
          ];
        }

        const { layoutWidth, layoutHeight, aspectRatioFill } =
          getAspectRatioLayout({
            layout: HTMLAttributes.layout,
            mediaWidth: HTMLAttributes.width,
            mediaHeight: HTMLAttributes.height,
          });

        const imgAttributes = {
          "data-width": width,
          "data-height": height,
          "data-image-id": imageId,
          "data-layout": layout,
          "data-zoom-src": zoomSrc,
          ...otherAttrs,
        };

        // If aspectRatioFill not exists, render image without it
        if (!aspectRatioFill) {
          return ["img", imgAttributes];
        }

        return [
          "div",
          {
            "data-layout": layout,
            class: "aspectRatioPlaceholder",
            style:
              layoutWidth && layoutHeight
                ? `max-width: ${layoutWidth}px; max-height: ${layoutHeight}px;`
                : null,
          },
          [
            "div",
            {
              class: "aspectRatioPlaceholder-fill",
              style: `padding-bottom: ${aspectRatioFill}%;`,
            },
          ],
          ["img", imgAttributes],
        ];
      },
    },

    iframe: {
      atom: true,

      attrs: {
        src: { default: null },
        frameborder: { default: 0 },
        allowfullscreen: { default: true },
        layout: { default: "inset-center" },
        mediaId: { default: null },
        width: { default: null },
        height: { default: null },
        naturalWidth: { default: null },
        naturalHeight: { default: null },
      },

      parseDOM: [
        {
          tag: "iframe",
          getAttrs: (dom: HTMLElement) => {
            if (
              !dom.getAttribute("src") ||
              !dom.getAttribute("data-media-id")
            ) {
              return false;
            }

            return {
              mediaId: dom.getAttribute("data-media-id"),
              src: dom.getAttribute("src"),
              width: dom.getAttribute("data-width"),
              height: dom.getAttribute("data-height"),
              frameborder: dom.getAttribute("frameborder"),
              allowfullscreen: dom.getAttribute("allowfullscreen"),
              layout: dom.getAttribute("data-layout"),
            };
          },
        },
      ],

      toDOM({ HTMLAttributes }) {
        const {
          src,
          width,
          height,
          mediaId,
          layout,
          naturalWidth,
          naturalHeight,
          ...otherAttrs
        } = HTMLAttributes;

        const layoutWidth = getLayoutWidth(layout, width);

        const realWidth = naturalWidth || width || layoutWidth;
        const realHeight = naturalHeight || height || 281;

        const padding = (realHeight / realWidth) * 100;

        return [
          "div",
          {
            "data-layout": layout,
            class: "aspectRatioPlaceholder",
            style: layoutWidth ? `max-width: ${layoutWidth}px;` : null,
          },
          [
            "div",
            {
              class: "aspectRatioPlaceholder-fill",
              style: `padding-bottom: ${padding}%;`,
            },
          ],
          [
            "div",
            { class: "iframeContainer" },

            [
              "iframe",
              {
                src,
                "data-width": width,
                "data-height": height,
                "data-media-id": mediaId,
                "data-layout": layout,
                ...otherAttrs,
              },
            ],
          ],
        ];
      },
    },
  };
}
