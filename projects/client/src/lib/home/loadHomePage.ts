import type { ServerLoadEvent } from '@sveltejs/kit';
import { fetchWithUserAgent } from '../api/withUserAgent.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { edgeCache } from '../utils/edgeCache.ts';
import { loadHome } from './loadHome.ts';

type HomePageEvent = Pick<ServerLoadEvent, 'depends' | 'fetch' | 'url'> & {
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
    cache: edgeCache(),
    origin: event.url.origin,
  });
}
