import { toAbsoluteUrl } from '../seo/jsonLd/toAbsoluteUrl.ts';
import type { PreviewArtRef } from './PreviewArtRef.ts';

/**
 * A link preview's art, through og's `/api/art` route: the first of `refs` that exists on media.trakt.tv, else OG's
 * placeholder. A crawler can't fall back on a 404, so a page never names media.trakt.tv art in its preview directly.
 */
export function previewArt(...refs: readonly PreviewArtRef[]): string {
  return toAbsoluteUrl(`/api/art/${refs.map(({ type, id, slot }) => `${type}/${id}/${slot}`).join('/')}`);
}
