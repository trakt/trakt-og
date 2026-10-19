import { error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { extractPageMeta } from '../api/extractPageMeta.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { loadPersonSubpage } from '../subpage/loadPersonSubpage.ts';
import { loadSubpageMedia } from '../subpage/loadSubpageMedia.ts';
import type { SubpageItem } from '../subpage/SubpageItem.ts';
import { summaryListSchema } from '../summary/summaryListSchema.ts';
import { type SummaryList, toSummaryList } from '../summary/toSummaryList.ts';
import { type ItemListQuery, itemListQuery, itemListSorts, itemListTypes } from './itemListQuery.ts';
import { sortOwnLists } from './sortOwnLists.ts';

/** The item a lists page is under: a media subpage item, or a person. */
export type ItemListsItem = SubpageItem | { readonly type: 'person'; readonly id: string };

type Params = Omit<Parameters<typeof loadSubpageMedia>[0], 'suffix' | 'item'> & {
  item: ItemListsItem;
  url: URL;
  /** The optional `/:type` and `/:sort_by` segments. */
  type: string | undefined;
  sortBy: string | undefined;
  /** The viewer's, for the Me type. */
  token: string | null;
};

// OG's `per_page`.
const LIMIT = 30;

// @trakt/api 0.6.0's list types don't match the worker's (which quietly serves personal lists for any it doesn't
// know), so og calls the route raw and parses it.
const listsSchema = z.array(summaryListSchema);

const itemPath = (item: ItemListsItem): string => {
  const id = encodeURIComponent(item.id);
  if (item.type === 'movie') return `/movies/${id}`;
  if (item.type === 'person') return `/people/${id}`;
  if (item.type === 'show') return `/shows/${id}`;
  const season = `/shows/${id}/seasons/${encodeURIComponent(item.season)}`;
  return item.type === 'season' ? season : `${season}/episodes/${encodeURIComponent(item.episode)}`;
};

/** The viewer's own lists with the item: `/listed` sends them all at once, unsorted, so they come back as one page. */
async function readOwnLists(
  fetch: typeof globalThis.fetch,
  item: ItemListsItem,
  query: ItemListQuery,
  token: string | null,
) {
  const none = { lists: [] as readonly SummaryList[], count: 0, page: null };
  if (!token) return none;
  const response = await rawApiFetch({ fetch, token, path: `${itemPath(item)}/listed?extended=images` });
  if (response.status === 401 || response.status === 404) return none;
  if (!response.ok) error(502, 'The Trakt API could not load your lists.');
  const rows = z.array(z.unknown()).safeParse(await response.json().catch(() => null));
  if (!rows.success) error(502, 'The Trakt API returned invalid lists data.');
  // Row by row: the watchlist and favorites come back without a name, and only personal lists show here anyway.
  const lists = rows.data.flatMap((row) => {
    const parsed = summaryListSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
  const own = sortOwnLists(lists, query.sortBy).map(toSummaryList);
  return { lists: own, count: own.length, page: null };
}

async function readLists(fetch: typeof globalThis.fetch, item: ItemListsItem, query: ItemListQuery, page: number) {
  const { api: type } = itemListTypes[query.type];
  const { api: sort } = itemListSorts[query.sortBy];
  const search = new URLSearchParams({ extended: 'images', page: String(page), limit: String(LIMIT) });
  const response = await rawApiFetch({ fetch, path: `${itemPath(item)}/lists/${type}/${sort}?${search}` });
  // The item's own 404 comes from the summary read.
  if (response.status === 404) return { lists: [] as readonly SummaryList[], count: 0, page: null };
  if (!response.ok) error(502, 'The Trakt API could not load the lists.');
  const lists = listsSchema.safeParse(await response.json().catch(() => null));
  if (!lists.success) error(502, 'The Trakt API returned invalid lists data.');
  const meta = extractPageMeta(response.headers, page);
  return {
    lists: lists.data.map(toSummaryList),
    count: Number(response.headers.get('x-pagination-item-count') ?? lists.data.length),
    page: meta.type === 'paginated' ? meta : null,
  };
}

/**
 * `/movies/:id/lists(/:type)(/:sort_by)`, the show, season, episode and person ones: 30 public lists a page under the subpage frame. The worker leaves out clones.
 */
export async function loadItemLists({ fetch, parent, item, url, type, sortBy, token }: Params) {
  const query = itemListQuery(type, sortBy);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '', 10) || 1);
  const [subpage, lists] = await Promise.all([
    item.type === 'person'
      ? loadPersonSubpage({ fetch, parent, id: item.id, suffix: 'lists' })
      : loadSubpageMedia({ fetch, parent, item, suffix: 'lists' }),
    query.type === 'me' ? readOwnLists(fetch, item, query, token) : readLists(fetch, item, query, page),
  ]);
  return { ...subpage, ...lists, kind: item.type, query };
}
