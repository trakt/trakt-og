import { fetchListStats } from '../lists/fetchListStats.ts';
import { MAX_STATS_PAGES, STATS_PAGE } from '../lists/loadListItems.ts';
import { fetchSmartListItems } from '../lists/smart/loadSmartList.ts';
import { type ListStats, toListStats } from '../lists/toListStats.ts';
import { type ListPin, pinItemsBase } from './listPins.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  pin: ListPin;
  /** The list's item count, which sets how many pages to read. */
  total: number;
};

async function smartStats({ fetch, pin, total }: Params): Promise<ListStats | null> {
  const pages = Math.ceil(total / STATS_PAGE);
  if (pages > MAX_STATS_PAGES) return null;
  const sort = { by: 'rank', how: 'asc' };
  const read = (page: number) =>
    fetchSmartListItems({ fetch, token: null, slug: pin.id, sort, page, limit: STATS_PAGE });
  const results = await Promise.all(Array.from({ length: pages }, (_, i) => read(i + 1))).catch(() => null);
  if (!results || results.some(({ status }) => status !== 200)) return null;
  return toListStats(
    results.flatMap(({ rows }) => rows),
    { withItems: true },
  );
}

/**
 * Every item on a pinned list, for its panel's watched and collected percentages and its progress bar: one read per
 * 250 items, in rank order. Null when the list is too long or a page fails, so the panel goes without them.
 */
export function fetchPinnedListStats(params: Params): Promise<ListStats | null> {
  if (params.total === 0) return Promise.resolve(toListStats([], { withItems: true }));
  if (params.pin.kind === 'smart') return smartStats(params);
  const query = { types: [], genres: [], page: 1, limit: STATS_PAGE };
  return fetchListStats({ ...params, base: pinItemsBase(params.pin), query, withItems: true });
}
