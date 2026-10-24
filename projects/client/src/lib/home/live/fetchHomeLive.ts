import { api } from '../../api/api.ts';
import type { HomeTrending } from './fetchHomeTrending.ts';
import type { HomeTrendingTitle } from './toHomeTrending.ts';
import { type HomeLive, type HomeWatchingSource, toHomeLive } from './toHomeLive.ts';

async function watchingOf(
  client: ReturnType<typeof api>,
  title: HomeTrendingTitle,
): Promise<HomeWatchingSource | null> {
  const request = { params: { id: title.slug }, query: { extended: 'full' as const } };
  const response = await (title.type === 'shows'
    ? client.shows.watching(request)
    : client.movies.watching(request)
  ).catch(() => null);
  if (response?.status !== 200) return null;
  return { type: title.type, title: title.title, year: title.year, href: title.href, watchers: response.body };
}

/**
 * Who is watching the trending titles right now, from one public `/watching` read per title. The API keeps each for
 * 15 minutes. A title that fails drops out; with none at all it throws, so the cache keeps the last good count.
 */
export async function fetchHomeLive(fetch: typeof globalThis.fetch, trending: HomeTrending): Promise<HomeLive> {
  const client = api({ fetch });
  const sources = await Promise.all([...trending.shows, ...trending.movies].map((title) => watchingOf(client, title)));
  const read = sources.filter((source) => source !== null);
  if (read.length === 0) throw new Error('No watching list answered.');
  return toHomeLive(read);
}
