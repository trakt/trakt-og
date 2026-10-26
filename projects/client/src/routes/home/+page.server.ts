import { fetchWithUserAgent } from '../../lib/api/withUserAgent.ts';
import { loadHome } from '../../lib/home/loadHome.ts';
import type { KeyedCache } from '../../lib/utils/sharedCache.ts';

export const load = (event) => {
  event.depends('trakt:home');
  return loadHome({
    ...event,
    liveFetch: fetchWithUserAgent(),
    now: Date.now(),
    random: Math.random,
    // The adapter types the cache with the Worker's own Response, which TypeScript can't match to the DOM's; at
    // runtime they're one class.
    cache: event.platform?.caches?.default as unknown as KeyedCache | undefined,
    origin: event.url.origin,
  });
};
