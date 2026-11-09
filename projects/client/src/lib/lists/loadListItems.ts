import { error } from '@sveltejs/kit';
import type { PageMeta } from '../api/PageMeta.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { listCoverOf } from './listCoverOf.ts';
import { type ListItemRow, listItemRowsSchema } from './listItemRowsSchema.ts';
import { listPageMeta } from './listPageMeta.ts';
import type { ListQuery } from './ListQuery.ts';
import { type ListSort, resolveListSort } from './resolveListSort.ts';
import { type ListItemCard, toListItemCard } from './toListItemCard.ts';
import { toListItemsSearch } from './toListItemsSearch.ts';
import { type ListStats, toListStats } from './toListStats.ts';
import { isBrowserSort } from './viewerSort.ts';

// Sorts about the viewer the worker orders, so it needs their token. The rest are ordered in the browser.
const VIEWER_SORTS = ['my_rating'];

type ItemsRequest = {
  fetch: typeof globalThis.fetch;
  token: string | null;
  /** The items path before its `/:type/:sort_by/:sort_how` segments. */
  base: string;
  query: ListQuery;
  /** Left out, the worker applies the list's default. */
  sort?: ListSort;
};

export type ListItems = { status: number; rows: readonly ListItemRow[]; headers: Headers };

/** A page of a list's items: `<base>/:types/:sort_by/:sort_how` with the genre filter and OG's page size. */
export async function fetchListItems({ fetch, token, base, query, sort }: ItemsRequest): Promise<ListItems> {
  const types = query.types.length > 0 ? query.types.join(',') : 'all';
  const path = sort ? `/${types}/${sort.by}/${sort.how}` : query.types.length > 0 ? `/${types}` : '';
  const search = toListItemsSearch({ query, extended: 'full', page: query.page, limit: query.limit });
  const response = await rawApiFetch({ fetch, token, path: `${base}${path}?${search}` });
  if (response.status !== 200) return { status: response.status, rows: [], headers: response.headers };
  const rows = listItemRowsSchema.safeParse(await response.json().catch(() => null));
  if (!rows.success) error(502, 'Trakt returned an invalid list.');
  return { status: 200, rows: rows.data, headers: response.headers };
}

/** The sort the worker applied, from `X-Sort-By` and `X-Sort-How`. */
export function usedListSort(headers: Headers): { by: string | null; how: string | null } {
  return { by: headers.get('x-sort-by'), how: headers.get('x-sort-how') };
}

/** The sort the URL asked for, as the items request sends it. */
export function urlListSort(query: ListQuery): ListSort | undefined {
  return query.sortBy ? { by: query.sortBy, how: query.sortHow ?? 'asc' } : undefined;
}

// The worker's largest page, and enough of them for a VIP's 5,000-item watchlist (`TRAKT_WATCHLIST_ITEM_LIMIT_VIP`).
const STATS_PAGE = 250;
const MAX_STATS_PAGES = 20;
const RANKED: ListSort = { by: 'rank', how: 'asc' };

/**
 * Every item that matches the filters, in rank order, for a sort the browser orders: the worker's first page says how
 * many more to read at once. Past the stats bar's cap, the rest are left off.
 */
async function fetchWholeList({ query, ...request }: Omit<ItemsRequest, 'sort'>): Promise<ListItems> {
  const read = (page: number) =>
    fetchListItems({ ...request, query: { ...query, page, limit: STATS_PAGE }, sort: RANKED });
  const first = await read(1);
  const total = Number(first.headers.get('x-pagination-item-count')) || first.rows.length;
  const pages = Math.min(Math.ceil(total / STATS_PAGE), MAX_STATS_PAGES);
  if (first.status !== 200 || pages <= 1) return first;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => read(i + 2)));
  const failed = rest.find(({ status }) => status !== 200);
  return failed ?? { ...first, rows: [...first.rows, ...rest.flatMap(({ rows }) => rows)] };
}

type StatsRequest = Omit<ItemsRequest, 'sort'> & { total: number; withItems: boolean };

/**
 * The stats bar counts every item that matches the filters, and the worker pages them, so this reads every page at
 * once, in rank order so the pages don't shift under each other. A list too big for that, or a failed page, leaves
 * the bar without its computed stats.
 */
async function fetchListStats({ total, withItems, query, ...request }: StatsRequest): Promise<ListStats | null> {
  const pages = Math.ceil(total / STATS_PAGE);
  if (pages > MAX_STATS_PAGES) return null;
  const read = (page: number) =>
    fetchListItems({
      ...request,
      query: { ...query, page, limit: STATS_PAGE },
      sort: RANKED,
    });
  const results = await Promise.all(Array.from({ length: pages }, (_, i) => read(i + 1))).catch(() => null);
  if (!results || results.some(({ status }) => status !== 200)) return null;
  return toListStats(
    results.flatMap(({ rows }) => rows),
    { withItems },
  );
}

type LoadListItemsParams = {
  fetch: typeof globalThis.fetch;
  token: string | null;
  base: string;
  query: ListQuery;
  /** The read made alongside the frame's load, in the URL's sort. */
  first: ListItems;
  /** `first` was read with the viewer's token. */
  firstHasToken?: boolean;
  /** The list's own default sort. */
  fallback: ListSort;
  /** Only the viewer's token reads this list's items. */
  needsToken: boolean;
  /** A VIP owner's list puts its first ranked item on the profile cover. */
  ownerIsVip: boolean;
  /** A signed-in viewer's stats carry the ids the Watched and Collected percentages look up. */
  viewerSignedIn: boolean;
  datePreferences: DatePreferences;
};

/**
 * The items half of a list page, shared by personal lists, the watchlist and favorites: the sort
 * the page shows, a page of cards in it, the pagination and the VIP cover. The first read is reused when it's already
 * in that sort and was allowed to be; a list only the viewer can see, or a sort about the viewer, needs the token.
 */
export async function loadListItems({
  fetch,
  token,
  base,
  query,
  first,
  firstHasToken = false,
  fallback,
  needsToken,
  ownerIsVip,
  viewerSignedIn,
  datePreferences,
}: LoadListItemsParams) {
  const sort = resolveListSort({ query, fallback });
  // The worker answers these in rank order, so the page gets the whole list and the browser orders it.
  const sortInBrowser = Boolean(token) && isBrowserSort(sort.by);
  const needsViewer =
    Boolean(token) &&
    (needsToken || VIEWER_SORTS.includes(sort.by) || Boolean(query.watchnow) || (query.hide?.length ?? 0) > 0);
  const used = usedListSort(first.headers);
  const reuse = (!needsViewer || firstHasToken) && first.status === 200 && used.by === sort.by && used.how === sort.how;
  const viewerToken = needsViewer ? token : null;
  const isFirstRankedPage =
    sort.by === 'rank' &&
    sort.how === 'asc' &&
    query.page === 1 &&
    query.types.length === 0 &&
    query.genres.length === 0 &&
    !query.terms &&
    !query.watchnow &&
    !query.hide?.length;
  const firstRanked =
    ownerIsVip && !isFirstRankedPage
      ? fetchListItems({
          fetch,
          token: viewerToken,
          base,
          query: {
            ...query,
            types: [],
            genres: [],
            hide: [],
            terms: undefined,
            watchnow: undefined,
            page: 1,
            limit: 1,
          },
          sort: { by: 'rank', how: 'asc' },
        }).catch(() => null)
      : null;

  const [fetched, ranked] = await Promise.all([
    sortInBrowser
      ? fetchWholeList({ fetch, token: viewerToken, base, query })
      : reuse
        ? first
        : fetchListItems({ fetch, token: viewerToken, base, query, sort }),
    firstRanked,
  ]);
  // A stale token keeps the anonymous answer: the server never refreshes, the browser does.
  const items = fetched.status === 401 && first.status === 200 ? first : fetched;
  const wholeList = sortInBrowser && items === fetched;
  if ([403, 404].includes(items.status)) error(404, 'Page Not Found');
  // Hides are saved in a cookie, so failing the page would fail every visit: it renders empty, with a way to clear them.
  const hideFailed = items.status !== 200 && (query.hide?.length ?? 0) > 0;
  if (items.status !== 200 && !hideFailed) error(502, 'Trakt is having trouble loading this list.');

  const cards: ListItemCard[] = items.rows.map((row) => toListItemCard(row, { sortBy: sort.by, datePreferences }));
  const page: PageMeta = wholeList
    ? { type: 'paginated', current: query.page, total: Math.max(1, Math.ceil(cards.length / query.limit)) }
    : listPageMeta({ headers: items.headers, current: query.page, limit: query.limit, received: items.rows.length });
  const total = wholeList ? cards.length : Number(items.headers.get('x-pagination-item-count')) || cards.length;
  // Most lists fit on their first page, so the stats come from it and render with the page. Longer ones stream in.
  const complete = wholeList || (query.page === 1 && (items.rows.length < query.limit || items.rows.length >= total));
  const withItems = viewerSignedIn;
  const stats: ListStats | Promise<ListStats | null> = complete
    ? toListStats(items.rows, { withItems })
    : fetchListStats({ fetch, token: viewerToken, base, query, total, withItems });

  return {
    sort,
    /** `cards` is the whole list in rank order, for the page to sort by the viewer's overlay and cut to its page. */
    sortInBrowser: wholeList,
    cards,
    page,
    total,
    /** The stats bar's whole-list numbers, streamed when they take more reads. */
    stats,
    /** The hide filters broke the read, so the list shows a Clear filters way out instead of its items. */
    hideFailed,
    /** Read by the profile frame (`routes/users/[id]/+layout.svelte`). */
    listCover: ownerIsVip ? listCoverOf(ranked ? ranked.rows.at(0) : items.rows.at(0)) : undefined,
  };
}
