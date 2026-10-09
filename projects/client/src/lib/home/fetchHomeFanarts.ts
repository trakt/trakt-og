import { api } from '../api/api.ts';
import { homeFanartTitles } from './homeFanartTitles.ts';
import { type HomeFanart, type HomeFanartSource, toHomeFanarts } from './toHomeFanarts.ts';

type Title = (typeof homeFanartTitles)[number];

/** A title's public summary, read without a token. A failed one drops out instead of failing the hero. */
async function fetchSource(fetch: typeof globalThis.fetch, { type, slug }: Title): Promise<HomeFanartSource | null> {
  const client = api({ fetch });
  const query = { params: { id: slug }, query: { extended: 'full,images' as const } };
  const response = await (type === 'movie' ? client.movies.summary(query) : client.shows.summary(query))
    .catch(() => null);
  if (response?.status !== 200) return null;
  return { type, slug, title: response.body.title, fanart: response.body.images?.fanart?.at(0) };
}

/**
 * The hand-picked titles' fanart. With none at all it throws, so the cache keeps the last good set instead of storing
 * nothing.
 */
export async function fetchHomeFanarts(fetch: typeof globalThis.fetch): Promise<HomeFanart[]> {
  const sources = await Promise.all(homeFanartTitles.map((title) => fetchSource(fetch, title)));
  const fanarts = toHomeFanarts(sources.filter((source) => source !== null));
  if (fanarts.length === 0) throw new Error('No home fanart: every title summary failed.');
  return fanarts;
}
