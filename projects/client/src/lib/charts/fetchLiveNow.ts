import { api } from '../api/api.ts';
import type { MediaType } from './loadChart.ts';
import { sumTrendingWatchers } from './sumTrendingWatchers.ts';

/** Everyone watching each type right now. */
export type LiveNow = Readonly<Record<MediaType, number>>;

const TTL_MS = 5 * 60_000;

/**
 * Trending's Live now: how many people are watching shows and movies, each chart read whole. Unfiltered and public,
 * so it reads the same whatever the page filters, and kept for 5 minutes so paging the chart doesn't ask again. Null
 * unless both answer, since the section compares them; a failure isn't kept.
 */
export function createLiveNow(ttlMs = TTL_MS) {
  let kept: { at: number; live: Promise<LiveNow | null> } | undefined;

  async function load(fetch: typeof globalThis.fetch): Promise<LiveNow | null> {
    const client = api({ fetch });
    const watchers = (type: MediaType) => sumTrendingWatchers({ client, type }).catch(() => null);
    const [shows, movies] = await Promise.all([watchers('shows'), watchers('movies')]);
    return shows !== null && movies !== null ? { shows, movies } : null;
  }

  return (fetch: typeof globalThis.fetch, now = Date.now()): Promise<LiveNow | null> => {
    if (kept && now - kept.at < ttlMs) return kept.live;

    const live = load(fetch);
    kept = { at: now, live };
    void live.then((value) => {
      if (!value && kept?.live === live) kept = undefined;
    });
    return live;
  };
}

export const fetchLiveNow = createLiveNow();
