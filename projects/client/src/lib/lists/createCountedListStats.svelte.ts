import { viewerFetch } from '../auth/viewerFetch.ts';
import { fetchListStats } from './fetchListStats.ts';
import type { ListStatsRead } from './ListStatsRead.ts';
import type { ListStats } from './toListStats.ts';

const PENDING = new Promise<never>(() => {});

/**
 * A longer list's stats, counted over every page in the browser: the server renders the bar's shimmer, and effects only
 * run here. `stats` stays pending until the current read's count lands; `settled` is undefined while it counts and null
 * when it couldn't be counted. A count for an earlier read never shows for the next.
 */
export function createCountedListStats(read: () => ListStatsRead | null) {
  // Raw, so each read keeps its identity: a proxy of it would never match the page's current read.
  let counted = $state.raw<{ read: ListStatsRead; stats: Promise<ListStats | null> }>();
  let settled = $state.raw<{ read: ListStatsRead; stats: ListStats | null }>();

  $effect(() => {
    const current = read();
    if (!current) return;
    const stats = fetchListStats({ ...current, fetch: current.viewer ? viewerFetch() : globalThis.fetch });
    counted = { read: current, stats };
    void stats
      .catch(() => null)
      .then((resolved) => {
        settled = { read: current, stats: resolved };
      });
  });

  return {
    get stats(): Promise<ListStats | null> {
      return counted && counted.read === read() ? counted.stats : PENDING;
    },
    get settled(): ListStats | null | undefined {
      return settled && settled.read === read() ? settled.stats : undefined;
    },
  };
}
