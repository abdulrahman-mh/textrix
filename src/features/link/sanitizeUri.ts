/** TODO: For minimal bundle size, securely handle it without `micromark-util-sanitize-uri` lib. */

import { sanitizeUri } from 'micromark-util-sanitize-uri';

export const sanitizeHref = (href?: any) => {
  if (typeof href === 'string') {
    href = href.trim();
  }
  return addDefaultProtocol(sanitizeUri(href, /^https?$/i));
};

function addDefaultProtocol(uri: any, protocol = 'http') {
  if (!uri) return;

  /**
   * Is URI starts with:
   * - HTTP/s protocols
   * - Relative path e.g `/example`
   * - Fragment e.g `#title`
   * - Relative HTTP/s protocol e.g `//example.com`
   */
  if (/^(https?:\/\/|\/|\/\/|#)/.test(uri)) {
    return uri;
  }

  // Prepend the default protocol
  return `${protocol}://${encodeURIComponent(uri)}`;
}
