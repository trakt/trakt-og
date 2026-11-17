import type { ListStatsRead } from './ListStatsRead.ts';
import { fetchListItems, MAX_STATS_PAGES, RANKED, STATS_PAGE } from './loadListItems.ts';
import { type ListStats, toListStats } from './toListStats.ts';

type Params = Omit<ListStatsRead, 'viewer'> & {
  fetch: typeof globalThis.fetch;
};

/**
 * The stats bar counts every item that matches the filters, and the API pages them, so this reads every page at
 * once, in rank order so the pages don't shift under each other. A list too big for that, or a failed page, leaves
 * the bar without its computed stats. Run in the browser: `fetch` carries the viewer's sign-in for a list only they
 * can read.
 */
export async function fetchListStats({ fetch, base, query, total, withItems }: Params): Promise<ListStats | null> {
  const pages = Math.ceil(total / STATS_PAGE);
  if (pages > MAX_STATS_PAGES) return null;
  const read = (page: number) =>
    fetchListItems({ fetch, token: null, base, query: { ...query, page, limit: STATS_PAGE }, sort: RANKED });
  const results = await Promise.all(Array.from({ length: pages }, (_, i) => read(i + 1))).catch(() => null);
  if (!results || results.some(({ status }) => status !== 200)) return null;
  return toListStats(
    results.flatMap(({ rows }) => rows),
    { withItems },
  );
}
