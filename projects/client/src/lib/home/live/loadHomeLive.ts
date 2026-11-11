import { api } from '../../api/api.ts';
import { fetchLiveNow, type LiveNow } from '../../charts/fetchLiveNow.ts';
import { createTtlCache } from '../../utils/createTtlCache.ts';
import { type KeyedCache, sharedCache } from '../../utils/sharedCache.ts';
import { fetchHomeLive } from './fetchHomeLive.ts';
import { fetchHomeTrending, type HomeTrending } from './fetchHomeTrending.ts';
import { homeLiveSchema } from './homeLiveSchema.ts';
import { homeTrendingSchema } from './homeTrendingSchema.ts';
import type { HomeLive } from './toHomeLive.ts';

const MINUTE_MS = 60 * 1000;
// Each data center keeps one copy of trending and of who's watching for 15 minutes, shared by all its workers
// (`sharedCache`); a worker holds what it read for a minute more, so a page is never more than about 16 minutes behind.
const SHARED_SECONDS = 15 * 60;
const trendingCache = createTtlCache<HomeTrending>({ ttlMs: MINUTE_MS, retryMs: MINUTE_MS });
const liveCache = createTtlCache<HomeLive>({ ttlMs: MINUTE_MS, retryMs: MINUTE_MS });

interface LoadHomeLiveParams {
  fetch: typeof globalThis.fetch;
  /** The streamed live count uses a fetch without SvelteKit's completed-load dependency tracker. */
  liveFetch?: typeof globalThis.fetch;
  now: number;
  /** The data center's cache, `edgeCache()`; without one each worker reads the API itself. */
  cache?: KeyedCache;
  /** The request's origin, which the shared cache's keys live under. */
  origin?: string;
  /** Tests pass fresh caches; pages share one of each per worker. */
  trendingPool?: typeof trendingCache;
  livePool?: typeof liveCache;
  /** Trending's Live now, shared with the trending pages; tests pass a fresh one. */
  liveNow?: (fetch: typeof globalThis.fetch) => Promise<LiveNow | null>;
}

/**
 * Trending shows and movies, then who is watching them right now, as the home page and the live page's first paint
 * show them. Neither failing is an error: each comes back null.
 */
export function loadHomeLive({
  fetch,
  liveFetch = fetch,
  now,
  cache,
  origin = 'https://og.trakt.tv',
  trendingPool = trendingCache,
  livePool = liveCache,
  liveNow = fetchLiveNow,
}: LoadHomeLiveParams) {
  const shared = { cache, ttlSeconds: SHARED_SECONDS };
  const readTrending = () =>
    sharedCache({
      ...shared,
      key: `${origin}/_cache/home/trending`,
      parse: (value) => homeTrendingSchema.safeParse(value).data ?? null,
      load: () => fetchHomeTrending(api({ fetch })),
    });
  const readLive = (trending: HomeTrending) =>
    sharedCache({
      ...shared,
      key: `${origin}/_cache/home/live`,
      parse: (value) => homeLiveSchema.safeParse(value).data ?? null,
      load: () => fetchHomeLive({ fetch: liveFetch, trending, liveNow }),
    });

  const trending = trendingPool({ now, load: readTrending }).catch(() => null);
  const live = trending.then((titles) =>
    titles ? livePool({ now, load: () => readLive(titles) }).catch(() => null) : null,
  );
  return { trending, live };
}
