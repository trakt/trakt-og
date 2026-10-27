import type { ServerLoadEvent } from '@sveltejs/kit';
import { fetchWithUserAgent } from '../api/withUserAgent.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import type { KeyedCache } from '../utils/sharedCache.ts';
import { loadHome } from './loadHome.ts';

type HomePageEvent = Pick<ServerLoadEvent, 'depends' | 'fetch' | 'platform' | 'url'> & {
  parent: () => Promise<{ user: HeaderUser | null }>;
};

/** The home page's load, shared by `/home` and, signed out, `/`. */
export function loadHomePage(event: HomePageEvent) {
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
}
