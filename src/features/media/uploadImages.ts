import type { EditorView } from 'prosemirror-view';
import type { Editor } from '../../Editor';
import { findChildren } from '../../helpers/findNodes';
import { getDistributedWidth } from './helpers';
import { generateID } from '../core/uniqueIdPlugin';
import { NodeSelection, Selection } from 'prosemirror-state';

type UploadedImage = {
  file: File;
  url: string;
  width: number;
  height: number;
};

// Determines how many images should be placed in a row.
function getItemsPerRow(totalItems: number, currentIndex: number): number {
  const remainingItems = totalItems - currentIndex;
  return remainingItems === 4 ? 2 : Math.min(3, remainingItems);
}

// Handles inserting images into the editor
async function insertImageNodes({
  images,
  editor,
  view,
}: {
  images: UploadedImage[];
  editor: Editor;
  view: EditorView;
}) {
  const { state, dispatch } = view;
  const { tr, schema } = state;

  const uploadedImages: { file: File; id: string }[] = [];

  if (images.length === 1) {
    // Single image handling
    const { url, width, height, file } = images[0];
    const id = generateID();

    const figureNode = schema.nodes.figure.create(null, [
      schema.nodes.image.create({
        name: id,
        src: url,
        width,
        height,
      }),
      schema.nodes.figcaption.create(),
    ]);

    if (dispatch) {
      dispatch(
        tr
          .replaceSelectionWith(figureNode)
          .setSelection(NodeSelection.near(tr.doc.resolve(state.selection.anchor)))
          .scrollIntoView()
          .setMeta('preventFiguresChecks', true),
      );
    }
    uploadedImages.push({ file, id });
  } else {
    // Multiple images handling
    const imageRows: any[] = [];
    let index = 0;
    const totalImages = images.length;
    let lastImagePos = state.selection.anchor;

    while (index < totalImages) {
      const itemsPerRow = getItemsPerRow(totalImages, index);
      const rowImages = images.slice(index, index + itemsPerRow);
      const totalAspectRatio = rowImages.reduce((sum, img) => sum + img.width / img.height, 0);

      const rowNode = schema.nodes.imagesGrid.create(
        null,
        rowImages.map((image) => {
          const distributedWidth = getDistributedWidth(image.width, image.height, totalAspectRatio, itemsPerRow);
          const id = generateID();
          uploadedImages.push({ file: image.file, id });

          return schema.nodes.figure.create({ width: distributedWidth.toFixed(3) }, [
            schema.nodes.image.create({
              name: id,
              layout: 'grid',
              src: image.url,
              width: image.width,
              height: image.height,
            }),
            schema.nodes.figcaption.create(),
          ]);
        }),
      );

      imageRows.push(rowNode);
      index += itemsPerRow;
      lastImagePos += rowNode.content.size - 1;
    }

    if (dispatch) {
      dispatch(
        tr
          .insert(state.selection.anchor, imageRows)
          // .setSelection(NodeSelection.near(tr.doc.resolve(lastImagePos)))
          .setMeta('preventFiguresChecks', true)
          .scrollIntoView(),
      );
    }
  }

  async function uploadSingleImage({ file, id }: { file: File; id: string }) {
    try {
      const uploadResult = await editor.storage.media.uploadImage!({ file });

      if (!uploadResult) throw new Error('Failed to upload the image');

      const { state, dispatch } = view;
      const { tr } = state;
      const imageNode = findChildren(tr.doc, (node) => node.attrs.name === id)[0];

      if (imageNode) {
        const { node, pos } = imageNode;

        uploadResult.url =
          editor.storage.media.getOptimizedImageUrl?.({ layout: node.attrs.layout, src: uploadResult.url }) ||
          uploadResult.url;

        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          src: uploadResult.url,
          zoomSrc: editor.storage.media.getOptimizedImageUrl?.({ layout: 'fill-width', src: uploadResult.url }),
          imageId: uploadResult.imageId,
        }).setMeta('addToHistory', false);

        dispatch(tr);
      }
    } catch (error) {
      console.warn('Image upload failed:', error);

      const { state, dispatch } = view;
      const { tr } = state;
      const imageNode = findChildren(tr.doc, (node) => node.attrs.name === id)[0];

      if (imageNode) {
        tr.delete(imageNode.pos, imageNode.pos + imageNode.node.nodeSize).setMeta('addToHistory', false);
        dispatch(tr);
      }
    }
  }

  if (editor.storage?.media?.uploadImage) {
    await Promise.all(uploadedImages.map((image) => uploadSingleImage(image)));
  }
}

// Processes and uploads image files
export function uploadImages({ editor, files, view }: { editor: Editor; files: FileList; view: EditorView }) {
  const images: UploadedImage[] = [];
  let processedFiles = 0;

  // Sort files alphabetically by name
  const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));

  const onFileProcessed = () => {
    if (++processedFiles === files.length) {
      insertImageNodes({ images, editor, view });
    }
  };

  for (const file of sortedFiles) {
    if (file.size > (editor.storage.media?.maxImageSizeBytes ?? Number.POSITIVE_INFINITY)) {
      editor.storage.media?.onMaxFileSizeError?.(file);
      onFileProcessed();
      continue;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      images.push({
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        file,
      });
      onFileProcessed();
    };

    image.onerror = () => {
      editor.storage?.media?.onFileMountError?.(file);
      onFileProcessed();
    };

    image.src = url;
  }
}
