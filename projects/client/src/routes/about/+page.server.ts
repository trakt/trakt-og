import { loadAbout } from '../../lib/about/loadAbout.ts';
import type { KeyedCache } from '../../lib/utils/sharedCache.ts';

export const load = (event) =>
  loadAbout({
    fetch: event.fetch,
    now: Date.now(),
    random: Math.random,
    liveFetch: globalThis.fetch,
    githubToken: event.platform?.env.GITHUB_TOKEN,
    // The adapter types the cache with the Worker's own Response, which TypeScript can't match to the DOM's; at
    // runtime they're one class.
    cache: event.platform?.caches?.default as unknown as KeyedCache | undefined,
    origin: event.url.origin,
  });
