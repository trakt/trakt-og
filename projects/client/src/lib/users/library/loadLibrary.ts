import { error } from '@sveltejs/kit';
import { extractPageMeta } from '../../api/extractPageMeta.ts';
import type { PageMeta } from '../../api/PageMeta.ts';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { type FadeHide, parseFadeHide } from '../../components/filters/fadeHide.ts';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import { historyFilters } from '../history/historyFilters.ts';
import { type HistoryType, isHistoryType } from '../history/historyTypes.ts';
import { toHistoryDays } from '../history/toHistoryCard.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import { readProfileTab } from '../readProfileTab.ts';
import { withShowPosters } from '../withShowPosters.ts';
import { libraryRowsSchema, libraryShowsSchema } from './libraryRowsSchema.ts';
import { apiSortHow, type LibrarySort, librarySort } from './librarySort.ts';
import { libraryPath } from './libraryPath.ts';
import { canonicalRedirect } from '../../routing/canonicalRedirect.ts';
import { isLibrarySourceFilter, type LibrarySourceFilter, librarySources } from './librarySources.ts';
import { type LibraryCard, toLibraryCard, toLibraryShowCard } from './toLibraryCard.ts';
import { positiveInt } from '../../utils/positiveInt.ts';

type Params = {
  fetch: typeof fetch;
  locals: { token: string | null };
  params: { id: string; type?: string; sort?: string };
  url: URL;
  cookies: { get: (name: string) => string | undefined };
  parent: () => Promise<{ profile: ProfileUser; isSelf: boolean; datePreferences: DatePreferences }>;
};

type Range = { readonly startAt?: string; readonly endAt?: string };

// OG's `per(params[:limit] || 60)`, capped at the worker's MAX_LIMIT.
const PER_PAGE = 60;
const MAX_LIMIT = 250;

type Fetched = { status: number; body: unknown; total: number; page: PageMeta };

async function fetchPage({
  fetch,
  token,
  base,
  type,
  sort,
  source,
  range,
  current,
  limit,
}: {
  fetch: typeof globalThis.fetch;
  token: string | null;
  base: string;
  type: HistoryType;
  sort: LibrarySort;
  source: LibrarySourceFilter;
  range: Range;
  current: number;
  limit: number;
}): Promise<Fetched> {
  const query = new URLSearchParams({
    extended: 'full,images',
    page: String(current),
    limit: String(limit),
    // The Shows route takes no sort.
    ...(type !== 'shows' && { sort_by: sort.by, sort_how: apiSortHow(sort) }),
    ...(range.startAt && { start_at: range.startAt }),
    ...(range.endAt && { end_at: range.endAt }),
    ...(librarySources[source].availableOn && { available_on: librarySources[source].availableOn }),
  });
  const response = await rawApiFetch({
    fetch,
    token,
    path: `${base}/collection/${type === 'all' ? 'media' : type}?${query}`,
  });
  return {
    status: response.status,
    body: response.status === 200 ? await response.json().catch(() => null) : null,
    total: positiveInt(response.headers.get('x-pagination-item-count'), 0),
    page: extractPageMeta(response.headers, current),
  };
}

/**
 * `/users/:id/library(/:type)(/:sort_by/:sort_how)`: owned items newest first, under
 * day dividers on Added Date. One read per `readProfileTab`: a public profile's goes without the token alongside the
 * frame's load, and a private profile the viewer may see is read with it (the worker shows a private library to its
 * owner only). An unknown or default type or sort segment 301s to the page's own spelling.
 */
export async function loadLibrary({ fetch, locals, params, url, cookies, parent }: Params) {
  const type: HistoryType = params.type && isHistoryType(params.type) ? params.type : 'all';
  const sort = librarySort(type, params.sort);
  const sourceParam = url.searchParams.get('source');
  const source: LibrarySourceFilter = isLibrarySourceFilter(sourceParam) ? sourceParam : 'all';
  const base = `/users/${encodeURIComponent(params.id)}`;
  const current = positiveInt(url.searchParams.get('page'), 1);
  const limit = Math.min(positiveInt(url.searchParams.get('limit'), PER_PAGE), MAX_LIMIT);

  const layout = parent();
  // A bare date is read in the viewer's zone, which waits on the layout. Instants and no range don't.
  const dates = [url.searchParams.get('start_at'), url.searchParams.get('end_at')].filter(Boolean);
  const bare = dates.some((value) => !/(Z|[+-]\d\d:?\d\d)$/i.test(value ?? ''));
  const known = bare ? await layout : null;
  const { startAt, endAt } = historyFilters(url.searchParams, type, known?.datePreferences.timeZone ?? 'UTC');
  const range: Range = { ...(startAt && { startAt }), ...(endAt && { endAt }) };

  const request = { base, type, sort, source, range, current, limit };
  const {
    frame: { isSelf, datePreferences },
    result,
  } = await readProfileTab({
    fetch,
    token: locals.token,
    frame: known ?? layout,
    read: ({ fetch, token }) => fetchPage({ ...request, fetch, token }),
  });
  canonicalRedirect({
    requested: [`${base}/library`, params.type, params.sort].filter(Boolean).join('/'),
    canonical: `${base}/library${libraryPath(type, sort)}`,
    url,
  });

  const shell = {
    type,
    sort,
    source,
    range,
    isSelf,
    datePreferences,
    fadeHide: { fade: parseFadeHide(cookies.get('filter-fade-library')), hide: [] } satisfies FadeHide,
    dividers: cookies.get('filter-hide-dividers') !== '1',
  };
  const empty = {
    ...shell,
    cards: [] as LibraryCard[],
    days: [],
    total: 0,
    page: extractPageMeta(new Headers(), current),
  };
  if (!result) return empty;
  if (result.status === 404) error(404, 'Page Not Found');
  if (result.status !== 200) error(502, 'Trakt is having trouble loading this library.');

  let cards: LibraryCard[];
  if (type === 'shows') {
    const rows = libraryShowsSchema.safeParse(result.body);
    if (!rows.success) error(502, 'Trakt is having trouble loading this library.');
    cards = (await withShowPosters(fetch, rows.data)).map((row) => toLibraryShowCard(row, datePreferences));
  } else {
    const rows = libraryRowsSchema.safeParse(result.body);
    if (!rows.success) error(502, 'Trakt is having trouble loading this library.');
    const options = { sortBy: sort.by, screenshots: type === 'episodes', owner: isSelf, datePreferences };
    cards = rows.data.map((row) => toLibraryCard(row, options));
  }

  return {
    ...shell,
    cards,
    // OG only divides Added Date by day.
    days: sort.by === 'added' ? toHistoryDays(cards, datePreferences) : [],
    total: result.total,
    page: result.page,
  };
}
