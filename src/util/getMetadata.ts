import type { Schema } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { HeadingPluginKey } from '../features/core/headlinePlugin';
import { getHTMLFromFragment } from '../helpers/getHTMLFromFragment';

export interface Metadata {
  title?: string;
  subtitle?: string;
  kicker?: string;
  titleFallback?: string;
  subtitleFallback?: string;
  subtitleHTML?: string;
  kickerHTML?: string;
  /** Featured image or you can say the article cover image */
  featuredImage?: { url: string };
}

export function getMetadata(view: EditorView, schema: Schema): Metadata {
  const metadata: Metadata = {};
  const { doc } = view.state;
  const headline = HeadingPluginKey.getState(view.state)?.indexes;

  const setMetadata = (key: keyof Metadata, index?: number, asHTML = false) => {
    const node = index !== undefined ? doc.child(index) : null;
    if (node) {
      (metadata as any)[key] = node.textContent.trim();
      if (asHTML) {
        (metadata as any)[`${key}HTML`] = getHTMLFromFragment(node.content, schema);
      }
    }
  };

  setMetadata('title', headline?.title);
  setMetadata('subtitle', headline?.subtitle, true);
  setMetadata('kicker', headline?.kicker, true);

  // TODO: Resolve titleFallback from first biggest headline h3 have higher priority then h4 then normal paragraph
  // Don't forget to not select titleFallback with the same node of subtitleFallback
  doc.descendants((node, _, __, index) => {
    if (node.isTextblock && node.textContent.trim()) {
      const textContent = node.textContent.trim();

      if (metadata.title === undefined && metadata.titleFallback === undefined) {
        metadata.titleFallback = textContent;
      } else if (metadata.subtitle === undefined && metadata.subtitleFallback === undefined) {
        metadata.subtitleFallback = textContent;
        metadata.subtitleFallback = getHTMLFromFragment(node.content, schema);
      }
    }

    // Extract featured image if available
    if (!metadata.featuredImage && node.type.name === 'image' && node.attrs.src) {
      metadata.featuredImage = { url: node.attrs.src };
    }

    return !metadata.subtitle || !metadata.featuredImage;
  });

  return metadata;
}
