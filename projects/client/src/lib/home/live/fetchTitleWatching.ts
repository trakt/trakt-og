import type { api } from '../../api/api.ts';
import { cacheFreshFor } from '../../api/cacheFreshFor.ts';
import type { HomeWatchingSource } from './toHomeLive.ts';
import type { HomeTrendingTitle } from './toHomeTrending.ts';

/** One title's watchers, and how long until the API's cached copy of them can change. */
export type TitleWatching = { readonly source: HomeWatchingSource; readonly freshForMs: number | null };

/**
 * Who is watching one trending title right now, from its public `/watching` read, with only each person's name and
 * profile location kept, and how long the API will keep answering with this same copy (`cacheFreshFor`). Null when
 * the read fails, so the title drops out instead of failing the count.
 */
export async function fetchTitleWatching(
  client: ReturnType<typeof api>,
  title: HomeTrendingTitle,
): Promise<TitleWatching | null> {
  const request = { params: { id: title.slug }, query: { extended: 'full' as const } };
  const response = await (title.type === 'shows'
    ? client.shows.watching(request)
    : client.movies.watching(request)
  ).catch(() => null);
  if (response?.status !== 200) return null;
  const watchers = response.body.map(({ username, location }) => ({ username, location: location ?? null }));
  return {
    source: { type: title.type, title: title.title, year: title.year, href: title.href, watchers },
    freshForMs: cacheFreshFor(response.headers),
  };
}
