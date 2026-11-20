import { canonicalSortBy } from '../lists/listItemSorts.ts';
import type { ListItemRow } from '../lists/listItemRowsSchema.ts';
import {
  itemCount,
  type ListItems,
  MAX_WHOLE_LIST,
  RANKED,
  readAllPages,
  STATS_PAGE,
  shuffled,
  usedListSort,
} from '../lists/loadListItems.ts';
import type { ListSort } from '../lists/resolveListSort.ts';
import { type ListItemCard, toListItemCard } from '../lists/toListItemCard.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';

/**
 * What a panel read: its first items, the whole list for its hides, or only its first items because the list is
 * too long to hide in the browser.
 */
export type PanelScope = 'first' | 'whole' | 'tooLong';

/** A list panel on the dashboard: its items, how many the list holds, and the sort they came in. */
export type ListPanel = {
  readonly cards: readonly ListItemCard[];
  /** Every item on the list, for "All N items". */
  readonly total: number;
  readonly sort: ListSort;
  readonly scope: PanelScope;
};

/** OG's dashboard panels show up to three rows of six. */
export const PANEL_LIMIT = 18;

type ReadPanelItemsParams = {
  /** One page of the list in a sort; left out, the list's own. */
  read: (page: number, limit: number, sort?: ListSort) => Promise<ListItems>;
  sort?: ListSort;
  /** The panel hides some items, so it reads the whole list for the browser to drop them. */
  hiding: boolean;
};

/**
 * A list panel's items: its first 18, or, while it hides some, every item in its sort, as the list page reads them for
 * its hides. A list past the list page's cap keeps its first 18 and its hides stay off. Pages of a random sort would
 * repeat items, so that one is read ranked and shuffled once.
 */
export async function readPanelItems({
  read,
  sort,
  hiding,
}: ReadPanelItemsParams): Promise<{ items: ListItems; scope: PanelScope }> {
  if (!hiding) return { items: await read(1, PANEL_LIMIT, sort), scope: 'first' };
  const random = sort?.by === 'random';
  const page = (n: number) => read(n, STATS_PAGE, random ? RANKED : sort);
  const first = await page(1);
  if (first.status === 200 && itemCount(first) > MAX_WHOLE_LIST) {
    return { items: { ...first, rows: first.rows.slice(0, PANEL_LIMIT) }, scope: 'tooLong' };
  }
  const items = await readAllPages(page, first);
  return { items: random ? { ...items, rows: shuffled(items.rows) } : items, scope: 'whole' };
}

type ToListPanelParams = {
  items: { readonly rows: readonly ListItemRow[]; readonly headers: Headers };
  /** The sort the request named. Left out, the one the worker applied and reported in `X-Sort-By` and `X-Sort-How`. */
  sort?: ListSort;
  scope?: PanelScope;
  datePreferences: DatePreferences;
};

/** A read of list items as a panel, each card with the list page's lines for the sort. */
export function toListPanel({ items, sort, scope = 'first', datePreferences }: ToListPanelParams): ListPanel {
  const used = sort ?? usedListSort(items.headers);
  const by = canonicalSortBy(used.by ?? 'rank');
  const cards = items.rows.map((row) => toListItemCard(row, { sortBy: by, datePreferences }));
  return {
    cards,
    total: Number(items.headers.get('x-pagination-item-count')) || cards.length,
    sort: { by, how: used.how === 'desc' ? 'desc' : 'asc' },
    scope,
  };
}
