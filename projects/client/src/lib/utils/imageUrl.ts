export type ImageSize = 'thumb' | 'medium' | 'full';

/**
 * Turns an `extended=images` path (`media.trakt.tv/images/shows/.../posters/medium/abc.jpg.webp`) into an https URL
 * at the given size. The API only ever returns `medium`; `thumb` and `full` exist at the same path.
 */
export function imageUrl(path: string | null | undefined, size: ImageSize): string | undefined {
  const trimmed = path?.trim();
  if (!trimmed) return undefined;

  const sized = trimmed.replace(/\/(thumb|medium|full)\/(?=[^/]+$)/, `/${size}/`);
  return `https://${sized.replace(/^https?:\/\//, '')}`;
}

/**
 * The `.webp` copy media.trakt.tv keeps next to a show or movie image (`abc.jpg` → `abc.jpg.webp`). Cloudflare's hotlink
 * protection blocks the `.jpg` for other sites but not the `.webp`. Avatars have no copy, so they stay as they are.
 */
export function webpImageUrl(url: string): string {
  if (!/^https:\/\/media\.trakt\.tv\/images\/(shows|movies|seasons|episodes|people)\/.+\.(jpe?g|png)$/.test(url)) {
    return url;
  }

  return `${url}.webp`;
}
