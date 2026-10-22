import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { createTtlCache } from '../utils/createTtlCache.ts';
import { fetchHomeFanarts } from './fetchHomeFanarts.ts';
import { fetchHomeLive } from './live/fetchHomeLive.ts';
import { fetchHomeTrending, type HomeTrending } from './live/fetchHomeTrending.ts';
import type { HomeLive } from './live/toHomeLive.ts';
import { pickHomeFanarts } from './pickHomeFanarts.ts';
import type { HomeFanart } from './toHomeFanarts.ts';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
/** The posters under the hero, per type: two rows of five when the types stack, of four side by side. */
const POSTERS = 10;

// The titles are fixed and their art changes rarely, so it's read at most every six hours per worker. Each visit
// still gets its own shuffle.
const fanartPool = createTtlCache<HomeFanart[]>({ ttlMs: 6 * HOUR_MS, retryMs: 5 * MINUTE_MS });
// The API keeps trending and each title's watchers for 15 minutes, so reading them sooner gets the same answer.
const trendingCache = createTtlCache<HomeTrending>({ ttlMs: 15 * MINUTE_MS, retryMs: MINUTE_MS });
const liveCache = createTtlCache<HomeLive>({ ttlMs: 15 * MINUTE_MS, retryMs: MINUTE_MS });

interface LoadHomeParams {
  fetch: typeof globalThis.fetch;
  /** The streamed live count uses a fetch without SvelteKit's completed-load dependency tracker. */
  liveFetch?: typeof globalThis.fetch;
  now: number;
  random: () => number;
  parent: () => Promise<{ user: HeaderUser | null }>;
  /** Tests pass fresh caches; the page shares one of each per worker. */
  pool?: typeof fanartPool;
  trendingPool?: typeof trendingCache;
  livePool?: typeof liveCache;
}

/**
 * `/home`: the hero's fanart, shuffled, trending shows and movies, and whether the viewer is signed in. Who is
 * watching right now streams in after, since it reads every trending title's watchers. Nothing failing is an error.
 */
export async function loadHome({
  fetch,
  liveFetch = fetch,
  now,
  random,
  parent,
  pool = fanartPool,
  trendingPool = trendingCache,
  livePool = liveCache,
}: LoadHomeParams) {
  const [fanarts, trending, { user }] = await Promise.all([
    pool({ now, load: () => fetchHomeFanarts(fetch) }).catch((): HomeFanart[] => []),
    trendingPool({ now, load: () => fetchHomeTrending(fetch) }).catch(() => null),
    parent(),
  ]);
  const live = trending
    ? livePool({ now, load: () => fetchHomeLive(liveFetch, trending) }).catch(() => null)
    : Promise.resolve(null);

  return {
    fanarts: pickHomeFanarts({ pool: fanarts, count: fanarts.length, random }),
    signedIn: user !== null,
    posters: trending && { shows: trending.shows.slice(0, POSTERS), movies: trending.movies.slice(0, POSTERS) },
    live,
  };
}
