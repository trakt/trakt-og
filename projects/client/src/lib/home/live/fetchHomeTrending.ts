import { api } from '../../api/api.ts';
import type { HomeMediaType } from './toHomeLive.ts';
import { type HomeTrendingTitle, toHomeTrending } from './toHomeTrending.ts';

/** How many trending titles of each type the map reads watchers from. The page shows the first eight as posters. */
const HOME_TRENDING_LIMIT = 60;

export type HomeTrending = Readonly<Record<HomeMediaType, readonly HomeTrendingTitle[]>>;

async function trendingOf(client: ReturnType<typeof api>, type: HomeMediaType) {
  const query = { query: { limit: HOME_TRENDING_LIMIT, extended: 'images' as const } };
  if (type === 'shows') {
    const response = await client.shows.trending(query);
    if (response.status !== 200) throw new Error(`Trending shows answered ${response.status}.`);
    return toHomeTrending(type, response.body.map(({ watchers, show }) => ({ watchers, item: show })));
  }
  const response = await client.movies.trending(query);
  if (response.status !== 200) throw new Error(`Trending movies answered ${response.status}.`);
  return toHomeTrending(type, response.body.map(({ watchers, movie }) => ({ watchers, item: movie })));
}

/** Trending shows and movies, read without a token. Either failing throws, so the cache keeps the last good pair. */
export async function fetchHomeTrending(fetch: typeof globalThis.fetch): Promise<HomeTrending> {
  const client = api({ fetch });
  const [shows, movies] = await Promise.all([trendingOf(client, 'shows'), trendingOf(client, 'movies')]);
  return { shows, movies };
}
