import { fetchListItems } from '../lists/loadListItems.ts';
import type { ListSort } from '../lists/resolveListSort.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { type ListPanel, readPanelItems, toListPanel } from './toListPanel.ts';

type FetchWatchlistParams = {
  fetch: typeof globalThis.fetch;
  /** Null from the browser, whose `viewerFetch` signs the request itself. */
  token: string | null;
  datePreferences: DatePreferences;
  /** The panel's own sort. Left out, the watchlist's. */
  sort?: ListSort | null;
  /** The panel's hides, which read the whole watchlist. */
  hide?: readonly string[];
};

export type DashboardWatchlist = ListPanel;

/**
 * The viewer's watchlist panel: the first 18 items in the sort picked on the panel, or else the watchlist's own, which
 * the worker applies when the request names none. While the panel hides some, the whole watchlist. The cards carry the
 * list page's sort-dependent lines.
 */
export async function fetchWatchlist({
  fetch,
  token,
  datePreferences,
  sort,
  hide = [],
}: FetchWatchlistParams): Promise<DashboardWatchlist> {
  const { items, scope } = await readPanelItems({
    read: (page, limit, by) =>
      fetchListItems({
        fetch,
        token,
        base: '/users/me/watchlist',
        query: { types: [], genres: [], page, limit },
        ...(by && { sort: by }),
      }),
    sort: sort ?? undefined,
    hiding: hide.length > 0,
  });
  if (items.status !== 200) throw new Error(`The watchlist failed with ${items.status}`);
  return toListPanel({ items, sort: sort ?? undefined, scope, datePreferences });
}
