import { error, redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { extractPageMeta } from '../api/extractPageMeta.ts';
import type { DateOrder } from '../utils/formatDate.ts';
import { findSearchType } from './findSearchType.ts';
import { retiredSearchTypes } from './retiredSearchTypes.ts';
import { isIdType } from './isIdType.ts';
import { toSearchCard } from './toSearchCard.ts';
import { toSearchListRow } from './toSearchListRow.ts';
import { searchRowsSchema } from './searchRowsSchema.ts';
import { searchDisplay } from './searchDisplay.ts';
import { searchFilters } from './searchFilters.ts';
import { positiveInt } from '../utils/positiveInt.ts';
import { searchListType } from './searchListType.ts';
import type { SearchListType } from './searchListTypes.ts';

type LoadSearchParams = {
  fetch: typeof fetch;
  token?: string | null;
  cookies: { get: (name: string) => string | undefined };
  /** The layout's viewer settings carry the profile's search image type, the Display's starting artwork. */
  parent: () => Promise<{ datePreferences: { order: DateOrder }; settings?: unknown }>;
  url: URL;
  /** The `/search/<type>` segment. Left out, it's Shows & Movies. */
  type?: string;
  /** `/search/<type>/<id>` puts the query in the path. */
  id?: string;
};

// OG's `set_params`: 36 a page unless `limit` says otherwise.
const PER_PAGE = 36;
const EXTENDED = 'full,images';

// The tabs that hide the type tag.
const NO_TYPE_TAG = new Set(['shows', 'movies', 'people']);

/**
 * Public searches omit the viewer token; typed Hide requests need it. A single ID match redirects, like OG, and so
 * does a retired tab, to Shows & Movies.
 */
export async function loadSearch({ fetch, token, cookies, parent, url, type: slug, id }: LoadSearchParams) {
  const query = (id ?? url.searchParams.get('query') ?? url.searchParams.get('q') ?? '').trim();
  if (slug && retiredSearchTypes.includes(slug)) {
    redirect(301, query ? `/search?${new URLSearchParams({ query })}` : '/search');
  }

  const type = findSearchType(slug);
  if (!type) error(404, 'Not Found');

  const page = positiveInt(url.searchParams.get('page'), 1);
  const limit = Math.min(positiveInt(url.searchParams.get('limit'), PER_PAGE), 50);

  const filters = searchFilters({ slug: type.slug, search: url.searchParams, cookies });
  const hide = filters.fadeHide.hide.map((id) => (id === 'watchlisted' ? 'watchlist' : id)).join(',');

  // OG listed everything by rank for a blank query. The worker wants one, so only Lists has something to show: the
  // popular lists of the picked type, all of them for official.
  const listType = type.slug === 'lists' && !query ? searchListType(url.searchParams.get('type')) : undefined;

  const browseLists = async (browsed: SearchListType) => {
    const client = api({ fetch });
    const listQuery = { page, limit, extended: 'full' } as const;
    const response =
      browsed === 'all'
        ? await client.lists.popular({ query: listQuery })
        : await client.lists.popularByType({ params: { type: browsed }, query: listQuery });
    if (response.status !== 200) return 'failed';
    return { hits: response.body.map(({ list }) => ({ type: 'list', list })), headers: response.headers };
  };

  const search = async () => {
    if (listType) return browseLists(listType);
    if (!query) return null;

    if ('idType' in type) {
      // `id_type` narrows the lookup to one kind, like OG's `/search/trakt?query=1&id_type=movie`.
      const kind = url.searchParams.get('id_type');
      const response = await api({ fetch }).search.lookup({
        params: { id_type: type.idType, id: query },
        query: { extended: EXTENDED, ...(kind ? { type: kind } : {}) },
      });
      return response.status === 200 ? { hits: response.body, headers: null } : 'failed';
    }

    if (!('text' in type)) return null;

    const publicQuery = { query, page, limit, extended: EXTENDED } as const;
    const viewerQuery = { ...publicQuery, hide };
    const request = (viewer: boolean) =>
      api({ fetch, token: viewer ? token : null }).search.query({
        params: { type: type.text },
        query: viewer ? viewerQuery : publicQuery,
      });
    const viewer = Boolean(token && hide);
    const first = await request(viewer);
    // The browser renews a stale token; SSR must still render a usable public search.
    const response = viewer && first.status === 401 ? await request(false) : first;
    return response.status === 200 ? { hits: response.body, headers: response.headers } : 'failed';
  };

  const [result, { datePreferences, settings }] = await Promise.all([search(), parent()]);
  if (result === 'failed') error(502, 'The Trakt API could not load this search.');

  const parsed = searchRowsSchema.safeParse(result?.hits ?? []);
  if (!parsed.success) error(502, 'The Trakt API returned invalid search results.');
  const hits = parsed.data;
  const cardOptions = {
    typeTag: !NO_TYPE_TAG.has(type.slug),
    premiereTag: isIdType(type),
    now: new Date(),
    order: datePreferences.order,
  };
  const cards = hits.map((hit) => toSearchCard(hit, cardOptions)).filter((card) => card !== null);

  // One match on an ID goes straight to it.
  const [only] = cards;
  if (isIdType(type) && hits.length === 1 && only) redirect(301, only.href);

  const headers = result?.headers;
  const pagination = headers ? extractPageMeta(headers, page) : { type: 'paginated' as const, current: 1, total: 1 };
  // An ID lookup has no paging headers: its hits are all there is.
  const count = positiveInt(headers?.get('x-pagination-item-count') ?? null, hits.length);
  return {
    filters,
    slug: type.slug,
    idMode: isIdType(type),
    query,
    display: searchDisplay({ cookies, settings }),
    cards,
    lists: hits.map(toSearchListRow).filter((row) => row !== null),
    page: pagination,
    /** Every match across the pages, or every list an empty Lists search browses, for the sidebar's count. */
    count: query || listType ? count : 0,
    /** The list type an empty Lists search browses. Any other search has none. */
    listType,
    /** The sidebar's own state, so SSR renders it as the viewer left it, like the calendar's. */
    sidebar: {
      collapsed: cookies.get('sidebar_collapsed') !== undefined,
      recent: cookies.get('sidebar_recent') !== 'closed',
      display: cookies.get('sidebar_display') !== 'closed',
    },
  };
}
