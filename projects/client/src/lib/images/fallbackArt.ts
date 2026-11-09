// A landscape thumb on the ID-based path: its own fanart stands in for it.
const THUMB = /^(https:\/\/media\.trakt\.tv\/[a-z]+\/\d+\/[a-z]+)\/thumb\.webp$/;

/**
 * The art an image tries when its own is missing: `mediaImage`'s `fallback`, kept in the URL's `#fallback=`, else a
 * landscape thumb's fanart at the same size.
 */
export function fallbackArt(src: string): string | undefined {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return undefined;
  }
  if (url.hash.startsWith('#fallback=')) return decodeURIComponent(url.hash.slice('#fallback='.length)) || undefined;
  const thumb = THUMB.exec(`${url.origin}${url.pathname}`);
  return thumb ? `${thumb[1]}/fanart.webp` : undefined;
}
