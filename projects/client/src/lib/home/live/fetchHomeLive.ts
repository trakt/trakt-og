import { api } from '../../api/api.ts';
import type { LiveNow } from '../../charts/fetchLiveNow.ts';
import type { HomeTrending } from './fetchHomeTrending.ts';
import { fetchTitleWatching } from './fetchTitleWatching.ts';
import { type HomeLive, toHomeLive } from './toHomeLive.ts';

interface FetchHomeLiveParams {
  fetch: typeof globalThis.fetch;
  trending: HomeTrending;
  /** Trending's Live now, `fetchLiveNow`; tests pass a fresh one. */
  liveNow: (fetch: typeof globalThis.fetch) => Promise<LiveNow | null>;
}

/**
 * Everyone watching right now, as Trending's Live now counts them, and where the people watching the trending titles
 * are, from one public `/watching` read per title. The API keeps each for 15 minutes. A title that fails drops out;
 * with none at all, or no total, it throws, so the cache keeps the last good count.
 */
export async function fetchHomeLive({ fetch, trending, liveNow }: FetchHomeLiveParams): Promise<HomeLive> {
  const client = api({ fetch });
  const [total, sources] = await Promise.all([
    liveNow(fetch),
    Promise.all([...trending.shows, ...trending.movies].map((title) => fetchTitleWatching(client, title))),
  ]);
  if (!total) throw new Error('Trending answered no total.');
  const read = sources.flatMap((watching) => (watching ? [watching.source] : []));
  if (read.length === 0) throw new Error('No watching list answered.');
  return toHomeLive(total, read);
}
