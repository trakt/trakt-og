import type { ServerLoadEvent } from '@sveltejs/kit';
import { fetchWithUserAgent } from '#lib/api/withUserAgent.ts';
import type { HeaderUser } from '#lib/components/header/HeaderUser.ts';
import { edgeCache } from '#lib/utils/edgeCache.ts';
import { loadLive } from './loadLive.ts';

type LivePageEvent = Pick<ServerLoadEvent, 'fetch' | 'url' | 'locals'> & {
  parent: () => Promise<{ user: HeaderUser | null }>;
};

/** The live page's load, with the shared cache and the streamed read's own fetch. */
export function loadLivePage(event: LivePageEvent) {
  return loadLive({ ...event, liveFetch: fetchWithUserAgent(), now: Date.now(), cache: edgeCache() });
}
