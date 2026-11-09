/** The art an image tries when its own is missing: `mediaImage`'s `fallback`, kept in the URL's `#fallback=`. */
export function fallbackArt(src: string): string | undefined {
  let hash: string;
  try {
    hash = new URL(src).hash;
  } catch {
    return undefined;
  }
  if (!hash.startsWith('#fallback=')) return undefined;
  return decodeURIComponent(hash.slice('#fallback='.length)) || undefined;
}
