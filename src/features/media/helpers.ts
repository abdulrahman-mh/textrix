import {
  type EditorState,
  NodeSelection,
  TextSelection,
  type Transaction,
} from "prosemirror-state";
import { findParentNode } from "../../helpers/findNodes";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import { Editor } from "../../Editor";

export type MediaLayout =
  | "inset-center"
  | "outset-center"
  | "fill-width"
  | "grid";

/**
 * Mapping of layout types to their corresponding width values.
 * If the value is `null`, so the media are not controlled with a custom width.
 */
const layoutMapping: Record<string, number | null> = {
  "inset-center": 700,
  "outset-center": 1192,
  "fill-width": null,
  grid: null,
};

/**
 * Gets the appropriate width for a given layout, considering media width.
 *
 * @param {string} [layout] - The layout type.
 * @param {number} [mediaWidth] - The original width of the media.
 * @returns {number | null} - The calculated layout width, or `null` if it should take full width.
 */
export function getLayoutWidth(
  layout?: string,
  mediaWidth?: number
): number | null {
  const selectedLayout =
    layout && layoutMapping[layout] !== undefined ? layout : "inset-center";

  const layoutWidth = layoutMapping[selectedLayout];

  // If no strict width for the layout, return null (full width)
  if (layoutWidth === null) {
    return null;
  }

  return mediaWidth !== undefined
    ? Math.min(layoutWidth, mediaWidth)
    : layoutWidth;
}

/**
 * Calculates the layout width, height, and aspect ratio fill percentage.
 *
 * @param {Object} params - The function parameters.
 * @param {string} [params.layout] - The layout type.
 * @param {number} [params.mediaWidth] - The original width of the media.
 * @param {number} [params.mediaHeight] - The original height of the media.
 * @returns {Object} - An object containing:
 *   - `layoutWidth` (number | null): The calculated width.
 *   - `layoutHeight` (number | undefined): The calculated height if applicable.
 *   - `aspectRatioFill` (number | undefined): The aspect ratio percentage for placeholders.
 */
export function getAspectRatioLayout({
  layout,
  mediaWidth,
  mediaHeight,
}: {
  layout?: string;
  mediaWidth?: number;
  mediaHeight?: number;
}): {
  layoutWidth?: number | null;
  layoutHeight?: number;
  aspectRatioFill?: number;
} {
  const layoutWidth = getLayoutWidth(layout, mediaWidth);

  return {
    layoutWidth,
    layoutHeight:
      layoutWidth && mediaWidth && mediaHeight
        ? (layoutWidth / mediaWidth) * mediaHeight
        : undefined,
    aspectRatioFill:
      mediaWidth && mediaHeight ? (mediaHeight / mediaWidth) * 100 : undefined,
  };
}

/**
 * Insert new line if the selection on media
 */
export function newLineInMedia(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) {
  const { selection, tr } = state;
  const { $anchor } = selection;

  const node = $anchor.node();

  const isInFigcaption = node.type.name === "figcaption";
  const parent =
    findParentNode((node) => node.type.name === "imagesGrid")(selection) ||
    findParentNode((node) => node.type.name === "figure")(selection);
  const paragraphNode = state.schema.nodes.paragraph.createAndFill();

  if (!paragraphNode) return false;

  if (isInFigcaption && parent) {
    // Insert at the end of the figure (after)
    const insertPos = parent.pos + parent.node.nodeSize;
    tr.insert(insertPos, paragraphNode);
    tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
    if (dispatch) dispatch(tr);
    return true;
  }

  if (parent) {
    // Insert at the beginning of the figure (before figcaption or image)
    const insertPos = parent.pos + 1; // Just inside the start of the figure
    tr.insert(insertPos, paragraphNode);
    tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
    if (dispatch) dispatch(tr);
    return true;
  }

  return false;
}

export function resetFigureNode(figure: ProseMirrorNode) {
  const image = figure.firstChild!;

  const updatedImage =
    image.attrs.layout === "grid"
      ? image.type.create(
          { ...image.attrs, layout: "inset-center" },
          image.content,
          image.marks
        )
      : image;

  const updatedFigure = figure.type.create(
    { ...figure.attrs, width: null },
    updatedImage,
    figure.marks
  );

  return updatedFigure;
}

/**
 * Calculates the total aspect ratio from an iterable or an object with a `forEach` method.
 * @param items - An iterable collection or an object with a `forEach` method.
 * @param getDimensions - A function to extract width and height from each item.
 * @returns The total aspect ratio.
 */
export function calculateTotalAspectRatio<T>(
  items: Iterable<T> | { forEach(callback: (item: T) => void): void },
  getDimensions: (item: T) => { width: number; height: number }
): number {
  let totalAspectRatio = 0;

  if ("forEach" in items) {
    // biome-ignore lint/complexity/noForEach: <explanation>
    items.forEach((item) => {
      const { width, height } = getDimensions(item);
      if (width && height) {
        totalAspectRatio += width / height;
      }
    });
  } else {
    for (const item of items) {
      const { width, height } = getDimensions(item);
      if (width && height) {
        totalAspectRatio += width / height;
      }
    }
  }

  return totalAspectRatio;
}

/**
 * Distributes width evenly based on aspect ratios.
 * @returns The calculated width for the item.
 */
export function getDistributedWidth(
  width: number,
  height: number,
  totalAspectRatio: number,
  itemsInRow: number
): number {
  const containerWidth = 1032;
  const gap = 10;

  const finalItems = Math.min(3, itemsInRow);

  const availableWidth = containerWidth - gap * (finalItems - 1);

  const imageWidth = (availableWidth * (width / height)) / totalAspectRatio;

  return (imageWidth / availableWidth) * 100;
}

/**
 * Checks if the selected media node has the specified media layout.
 */
export function isMediaLayoutActive(
  state: EditorState,
  layout: MediaLayout
): boolean {
  const { selection } = state;
  if (selection instanceof NodeSelection) {
    const { node } = selection;
    return (
      ["image", "iframe"].includes(node.type.name) &&
      node.attrs.layout === layout
    );
  }
  return false;
}

/**
 * Sets the specified media layout on the currently selected image node.
 */
export const applyMediaLayout =
  (layout: MediaLayout, editor: Editor) =>
  (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const { selection } = state;

    if (selection instanceof NodeSelection) {
      const node = selection.node;
      let newSrc = node.attrs.src;
      let zoomSrc;

      if (
        node.attrs.src &&
        !node.attrs.src.startsWith("blob:") &&
        editor.storage.media.getOptimizedImageUrl
      ) {
        newSrc = editor.storage.media.getOptimizedImageUrl({
          layout,
          src: node.attrs.src,
        });
        zoomSrc = editor.storage.media.getOptimizedImageUrl({
          layout: "fill-width",
          src: node.attrs.src,
        });
      }

      if (["image", "iframe"].includes(node.type.name)) {
        const tr = state.tr.setNodeMarkup(selection.from, undefined, {
          ...node.attrs,
          src: newSrc,
          zoomSrc,
          layout,
        });

        if (dispatch) {
          dispatch(tr);
        }
        return true;
      }
    }
    return false;
  };

/**
 * Determines whether the given media layout can be applied to the currently selected image.
 */
export function canApplyMediaLayout(
  state: EditorState,
  layout: MediaLayout
): boolean {
  const { selection } = state;

  if (!(selection instanceof NodeSelection)) return false;

  const node = selection.node;

  if (!["image", "iframe"].includes(node.type.name)) return false;

  if (node.type.name === "iframe") return true;

  const { width } = node.attrs;

  if (layout === "inset-center") {
    return true;
  }

  if (["outset-center", "fill-width"].includes(layout)) {
    return width >= 1192;
  }

  return false;
}

export function isImageHaveAlt(state: EditorState) {
  const { selection } = state;
  if (selection instanceof NodeSelection) {
    const node = selection.node;
    return node.type.name === "image" && !!node.attrs.alt;
  }
  return false;
}

export function isImageSelection(state: EditorState) {
  const { selection } = state;
  return (
    selection instanceof NodeSelection && selection.node.type.name === "image"
  );
}
