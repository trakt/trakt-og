import { error, type RequestHandler } from '@sveltejs/kit';
import fanartPlaceholder from '#lib/assets/placeholders/fanart.png';
import personPlaceholder from '#lib/assets/placeholders/person-zoidberg.png';
import posterPlaceholder from '#lib/assets/placeholders/poster.png';
import { mediaFolder } from '../../../../lib/images/mediaFolder.ts';
import { mediaImage } from '../../../../lib/images/mediaImage.ts';
import { parsePreviewArt } from '../../../../lib/images/parsePreviewArt.ts';
import type { PreviewArtRef } from '../../../../lib/images/PreviewArtRef.ts';
import { edgeCache } from '../../../../lib/utils/edgeCache.ts';

const DAY = 60 * 60 * 24;
const PLACEHOLDERS: Readonly<Record<string, string>> = { poster: posterPlaceholder, headshot: personPlaceholder };

// Which slots an item has, from its manifest on media.trakt.tv. Unreadable counts as none.
async function hasArt(fetch: typeof globalThis.fetch, { type, id, slot }: PreviewArtRef): Promise<boolean> {
  const response = await fetch(`${mediaFolder(type, id)}/images.json`, { headers: { 'User-Agent': 'og.trakt.tv' } });
  if (!response.ok) return false;
  const manifest: unknown = await response.json().catch(() => null);
  return typeof manifest === 'object' && manifest !== null && slot in manifest;
}

/**
 * A link preview's art (`previewArt`): redirects to the first of the path's refs that media.trakt.tv has, else to
 * OG's placeholder for the last ref's kind. Crawlers fetch it only when a link is shared or indexed, and the data
 * center keeps each answer a day.
 */
export const GET: RequestHandler = async ({ params, url, fetch }) => {
  const refs = parsePreviewArt(params.path ?? '');
  if (!refs) error(404);

  const cache = edgeCache();
  const hit = await cache?.match(url.href).catch(() => undefined);
  if (hit) return hit;

  const found = await Promise.all(refs.map((ref) => hasArt(fetch, ref).catch(() => false)));
  const art = refs.find((_, i) => found.at(i));
  const fallback = PLACEHOLDERS[refs.at(-1)?.slot ?? ''] ?? fanartPlaceholder;
  const location = art ? mediaImage({ ...art, size: 'medium' }) : new URL(fallback, url.origin).href;

  const response = new Response(null, {
    status: 302,
    headers: { location, 'cache-control': `public, max-age=${DAY}` },
  });
  await cache?.put(url.href, response.clone()).catch(() => undefined);
  return response;
};
