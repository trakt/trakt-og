import { fetchLiveNow, type LiveNow } from '../charts/fetchLiveNow.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { createTtlCache } from '../utils/createTtlCache.ts';
import { type KeyedCache, sharedCache } from '../utils/sharedCache.ts';
import { fetchHomeFanarts } from './fetchHomeFanarts.ts';
import { homeFanartsSchema } from './homeFanartsSchema.ts';
import { homeFanartTitles } from './homeFanartTitles.ts';
import { fetchHomeLive } from './live/fetchHomeLive.ts';
import { fetchHomeTrending, type HomeTrending } from './live/fetchHomeTrending.ts';
import { homeLiveSchema } from './live/homeLiveSchema.ts';
import { homeTrendingSchema } from './live/homeTrendingSchema.ts';
import type { HomeLive } from './live/toHomeLive.ts';
import { pickHomeFanarts } from './pickHomeFanarts.ts';
import type { HomeFanart } from './toHomeFanarts.ts';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
/** The posters under the hero, per type: two rows of five when the types stack, of four side by side. */
const POSTERS = 10;

// The titles are fixed and their art changes rarely, so each data center reads it at most every six hours and a
// worker holds its copy for an hour. The key names the titles, so a new list starts fresh on deploy. Each visit
// still gets its own shuffle.
const FANART_SECONDS = 6 * 60 * 60;
const FANART_KEY = homeFanartTitles.map(({ type, slug }) => `${type}-${slug}`).join(',');
const fanartPool = createTtlCache<HomeFanart[]>({ ttlMs: HOUR_MS, retryMs: 5 * MINUTE_MS });
// The API keeps trending and each title's watchers for 15 minutes, so reading them sooner gets the same answer. Each
// data center keeps one copy for that long, shared by all its workers (`sharedCache`); a worker holds what it read
// for a minute more, so a page is never more than about 16 minutes behind.
const SHARED_SECONDS = 15 * 60;
const trendingCache = createTtlCache<HomeTrending>({ ttlMs: MINUTE_MS, retryMs: MINUTE_MS });
const liveCache = createTtlCache<HomeLive>({ ttlMs: MINUTE_MS, retryMs: MINUTE_MS });

interface LoadHomeParams {
  fetch: typeof globalThis.fetch;
  /** The streamed live count uses a fetch without SvelteKit's completed-load dependency tracker. */
  liveFetch?: typeof globalThis.fetch;
  now: number;
  random: () => number;
  parent: () => Promise<{ user: HeaderUser | null }>;
  /** The data center's cache, `platform.caches.default`; without one each worker reads the API itself. */
  cache?: KeyedCache;
  /** The request's origin, which the shared cache's keys live under. */
  origin?: string;
  /** Tests pass fresh caches; the page shares one of each per worker. */
  pool?: typeof fanartPool;
  trendingPool?: typeof trendingCache;
  livePool?: typeof liveCache;
  /** Trending's Live now, shared with the trending pages; tests pass a fresh one. */
  liveNow?: (fetch: typeof globalThis.fetch) => Promise<LiveNow | null>;
}

/**
 * `/home`: the hero's fanart, shuffled, trending shows and movies, and whether the viewer is signed in. Who is
 * watching right now streams in after, since it reads every trending title's watchers and Trending's whole count.
 * Nothing failing is an error.
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
  liveNow = fetchLiveNow,
  cache,
  origin = 'https://og.trakt.tv',
}: LoadHomeParams) {
  const shared = { cache, ttlSeconds: SHARED_SECONDS };
  const readFanarts = () =>
    sharedCache({
      cache,
      ttlSeconds: FANART_SECONDS,
      key: `${origin}/_cache/home/fanarts?titles=${encodeURIComponent(FANART_KEY)}`,
      parse: (value) => homeFanartsSchema.safeParse(value).data ?? null,
      load: () => fetchHomeFanarts(fetch),
    });
  const readTrending = () =>
    sharedCache({
      ...shared,
      key: `${origin}/_cache/home/trending`,
      parse: (value) => homeTrendingSchema.safeParse(value).data ?? null,
      load: () => fetchHomeTrending(fetch),
    });
  const readLive = (trending: HomeTrending) =>
    sharedCache({
      ...shared,
      key: `${origin}/_cache/home/live`,
      parse: (value) => homeLiveSchema.safeParse(value).data ?? null,
      load: () => fetchHomeLive({ fetch: liveFetch, trending, liveNow }),
    });

  const [fanarts, trending, { user }] = await Promise.all([
    pool({ now, load: readFanarts }).catch((): HomeFanart[] => []),
    trendingPool({ now, load: readTrending }).catch(() => null),
    parent(),
  ]);
  const live = trending ? livePool({ now, load: () => readLive(trending) }).catch(() => null) : Promise.resolve(null);

  return {
    fanarts: pickHomeFanarts({ pool: fanarts, count: fanarts.length, random }),
    signedIn: user !== null,
    posters: trending && { shows: trending.shows.slice(0, POSTERS), movies: trending.movies.slice(0, POSTERS) },
    live,
  };
}
