import { rawApiFetch } from '../api/rawApiFetch.ts';
import { imageUrl } from '../utils/imageUrl.ts';

const cache = new Map<string, Promise<string | undefined>>();

/** A show's or movie's fanart, read once per page without a token. No art comes back as undefined. */
export function titleFanart(type: 'shows' | 'movies', slug: string, fetch: typeof globalThis.fetch = globalThis.fetch) {
  const key = `${type}/${slug}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const art = rawApiFetch({ fetch, path: `/${key}?extended=images` })
    .then((response) => (response.ok ? response.json() : null))
    .then((media: { images?: { fanart?: string[] } } | null) => imageUrl(media?.images?.fanart?.at(0), 'full'))
    .catch(() => undefined);
  cache.set(key, art);
  return art;
}
