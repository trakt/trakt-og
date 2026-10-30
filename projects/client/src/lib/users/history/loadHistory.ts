import type { UserStats } from '../../stats/userStatsSchema.ts';
import { error } from '@sveltejs/kit';
import { canonicalRedirect } from '../../routing/canonicalRedirect.ts';
import { signInRedirect } from '../../auth/signInRedirect.ts';
import { extractPageMeta } from '../../api/extractPageMeta.ts';
import type { PageMeta } from '../../api/PageMeta.ts';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { type FadeHide, parseFadeHide } from '../../components/filters/fadeHide.ts';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import { readProfileTab } from '../readProfileTab.ts';
import { withShowPosters } from '../withShowPosters.ts';
import { type HistoryCounts, historyCounts } from './historyCounts.ts';
import { type HistoryFilters, historyFilters } from './historyFilters.ts';
import { type ChartRow, fromWatched, isShowChart, sortCharts, toChartsFromPlays } from './historyCharts.ts';
import { type HistoryRow, historyRowsSchema, watchedMoviesSchema, watchedShowsSchema } from './historyRowsSchema.ts';
import { defaultHistorySort, type HistorySort, historyPath, historySort } from './historySort.ts';
import { type HistoryType, isHistoryType } from './historyTypes.ts';
import { historyItemTitle, toChartCard, toHistoryCard, toHistoryDays } from './toHistoryCard.ts';
import { positiveInt } from '../../utils/positiveInt.ts';

type Params = {
  fetch: typeof fetch;
  locals: { token: string | null };
  params: { id: string; type?: string; sort?: string };
  url: URL;
  cookies: { get: (name: string) => string | undefined };
  parent: () => Promise<{
    profile: ProfileUser;
    stats: UserStats | null;
    user: { readonly slug: string } | null;
    datePreferences: DatePreferences;
  }>;
};

// OG's `per(params[:limit] || 60)`.
const PER_PAGE = 60;
// The worker's MAX_LIMIT.
const MAX_LIMIT = 250;
// ponytail: a filtered chart reads up to 2,000 plays and groups them by show or movie. A long genre or Watch Now
// filter on a heavy account only charts the titles among its 2,000 newest matching plays; page further if anyone notices.
const MAX_PAGES = 8;
// ponytail: the API sorts the watched lists by last watched only, so any other sort reads the whole list and sorts it
// here. Past 5,000 shows or movies, only the 5,000 last watched are sorted.
const MAX_WATCHED_PAGES = 20;

type Fetched = {
  status: number;
  plays: HistoryRow[];
  charts: ChartRow[];
  total: number;
  page: PageMeta;
};

function query(filters: HistoryFilters, page: number, limit: number) {
  return new URLSearchParams({
    extended: 'full,images',
    page: String(page),
    limit: String(limit),
    ...(filters.startAt && { start_at: filters.startAt }),
    ...(filters.endAt && { end_at: filters.endAt }),
    ...(filters.genre && { genres: filters.genre }),
    ...(filters.watchnow && { watchnow: filters.watchnow }),
  });
}

async function read(fetch: typeof globalThis.fetch, token: string | null, path: string) {
  const response = await rawApiFetch({ fetch, token, path });
  const body = response.status === 200 ? await response.json().catch(() => null) : null;
  return { response, body };
}

const total = (headers: Headers) => positiveInt(headers.get('x-pagination-item-count'), 0);

/** Every page of a list, up to `max`, read side by side after the first. */
async function readAll<Row>(
  fetch: typeof globalThis.fetch,
  token: string | null,
  path: (page: number) => string,
  max: number,
  parse: (body: unknown) => Row[] | undefined,
) {
  const first = await read(fetch, token, path(1));
  const rows = parse(first.body);
  if (!rows) return { status: first.response.status, rows: undefined, total: 0 };
  const count = positiveInt(first.response.headers.get('x-pagination-page-count'), 1);
  const rest = await Promise.all(
    Array.from({ length: Math.min(count, max) - 1 }, (_, i) => read(fetch, token, path(i + 2))),
  );
  return {
    status: 200,
    rows: [...rows, ...rest.flatMap(({ body }) => parse(body) ?? [])],
    total: total(first.response.headers),
  };
}

const filtered = (filters: HistoryFilters) =>
  Boolean(filters.startAt || filters.endAt || filters.genre || filters.watchnow);

/**
 * One page of history: the plays, or a chart of shows or movies. The Shows tab is always a chart, and Movies is one
 * on any sort but Watched Date. The unfiltered Shows tab on Watched Date is the watched list, which the API pages by
 * last watched. Every other chart reads all of the watched list, or groups the filtered plays when there are filters,
 * since the watched lists take none, and sorts here.
 */
async function fetchPage({
  fetch,
  token,
  base,
  type,
  filters,
  sort,
  current,
  limit,
}: {
  fetch: typeof globalThis.fetch;
  token: string | null;
  base: string;
  type: HistoryType;
  filters: HistoryFilters;
  sort: HistorySort;
  current: number;
  limit: number;
}): Promise<Fetched> {
  const empty = { plays: [], charts: [], total: 0, page: extractPageMeta(new Headers(), current) };
  const invalid = (status: number) => ({ ...empty, status: status === 200 ? 502 : status });

  if (type === 'shows' && !filters.item && !filtered(filters) && sort.by === 'added') {
    const { response, body } = await read(fetch, token, `${base}/watched/shows?${query({}, current, limit)}`);
    const rows = watchedShowsSchema.safeParse(body);
    if (!rows.success) return invalid(response.status);
    return {
      ...empty,
      status: 200,
      charts: await withShowPosters(fetch, rows.data.map(fromWatched).filter(isShowChart)),
      total: total(response.headers),
      page: extractPageMeta(response.headers, current),
    };
  }

  if ((type === 'shows' || type === 'movies') && !filters.item && (type === 'shows' || sort.by !== 'added')) {
    const all = filtered(filters)
      ? await readAll(
          fetch,
          token,
          (n) => `${base}/history/${type}?${query(filters, n, MAX_LIMIT)}`,
          MAX_PAGES,
          (body) => historyRowsSchema.safeParse(body).data,
        ).then((read) => ({ ...read, rows: read.rows && toChartsFromPlays(read.rows) }))
      : await readAll(
          fetch,
          token,
          (n) => `${base}/watched/${type}?${query({}, n, MAX_LIMIT)}`,
          MAX_WATCHED_PAGES,
          (body) =>
            (type === 'shows' ? watchedShowsSchema : watchedMoviesSchema).safeParse(body).data?.map(fromWatched),
        );
    if (!all.rows) return invalid(all.status);
    const charts = sortCharts(all.rows, sort);
    const pages = Math.max(1, Math.ceil(charts.length / limit));
    const slice = charts.slice((current - 1) * limit, current * limit);
    const shows = slice.filter(isShowChart);
    return {
      ...empty,
      status: 200,
      charts: shows.length > 0 ? await withShowPosters(fetch, shows) : slice,
      total: filtered(filters) ? charts.length : (all.total ?? charts.length),
      page: { type: 'paginated', current: Math.min(current, pages), total: pages },
    };
  }

  const { item } = filters;
  const path = item ? `/history/${item.type}s/${item.id}` : type === 'all' ? '/history' : `/history/${type}`;
  const { response, body } = await read(fetch, token, `${base}${path}?${query(filters, current, limit)}`);
  if (response.status === 404) return { ...empty, status: 404 };
  const rows = historyRowsSchema.safeParse(body);
  if (!rows.success) return invalid(response.status);
  return {
    ...empty,
    status: 200,
    plays: rows.data,
    total: total(response.headers),
    page: extractPageMeta(response.headers, current),
  };
}

/**
 * `/users/:id/history(/:type)(/:sort_by/:sort_how)`: newest plays first, as poster cards under day dividers, or a
 * chart of shows or movies in OG's sort. An unknown or default sort segment 301s to the page's own spelling.
 * One read per `readProfileTab`: someone else's public profile goes without the token alongside the frame's load, and
 * your own, or a private profile the viewer may see, is read with it, so a play you just saved shows.
 */
export async function loadHistory({ fetch, locals, params, url, cookies, parent }: Params) {
  const type: HistoryType = params.type && isHistoryType(params.type) ? params.type : 'all';
  const base = `/users/${encodeURIComponent(params.id)}`;
  const current = positiveInt(url.searchParams.get('page'), 1);
  const limit = Math.min(positiveInt(url.searchParams.get('limit'), PER_PAGE), MAX_LIMIT);
  const layout = parent();
  // A bare date is read in the viewer's zone, which waits on the layout. Instants and no range don't.
  const range = [url.searchParams.get('start_at'), url.searchParams.get('end_at')].filter(Boolean);
  const bare = range.some((value) => !/(Z|[+-]\d\d:?\d\d)$/i.test(value ?? ''));
  const known = bare ? await layout : null;
  const filters = historyFilters(url.searchParams, type, known?.datePreferences.timeZone ?? 'UTC');
  // One item's plays run newest first only.
  const sort = filters.item ? defaultHistorySort : historySort(type, params.sort);
  canonicalRedirect({
    requested: [`${base}/history`, params.type, params.sort].filter(Boolean).join('/'),
    canonical: `${base}/history${historyPath(type, sort)}`,
    url,
  });

  const request = { base, type, filters, sort, current, limit };
  const {
    frame: { stats, user, datePreferences },
    result,
  } = await readProfileTab({
    fetch,
    token: locals.token,
    frame: known ?? layout,
    read: ({ fetch, token }) => fetchPage({ ...request, fetch, token }),
  });
  // OG sent signed-out visitors past page 1 to sign in.
  if (current > 1 && !user) signInRedirect(url);

  const fadeHide: FadeHide = { fade: parseFadeHide(cookies.get('filter-fade-history')), hide: [] };
  const dividers = cookies.get('filter-hide-dividers') !== '1';
  const shell = { type, filters, sort, fadeHide, dividers, datePreferences };
  // A locked profile shows the frame only.
  if (!result) {
    const counts: HistoryCounts = {};
    return {
      ...shell,
      charted: false,
      screenshots: false,
      days: [],
      counts,
      page: extractPageMeta(new Headers(), current),
      itemTitle: undefined,
    };
  }

  if (result.status === 404) error(404, 'Page Not Found');
  if (result.status !== 200) error(502, 'Trakt is having trouble loading this history.');

  const screenshots = type === 'episodes' || (filters.item !== undefined && filters.item.type !== 'movie');
  const charted = result.charts.length > 0;
  const cards = charted
    ? result.charts.map((row) => toChartCard(row, sort.by, datePreferences))
    : result.plays.map((row) => toHistoryCard(row, { screenshots, datePreferences }));

  return {
    ...shell,
    charted,
    screenshots,
    days: toHistoryDays(cards, datePreferences),
    counts: historyCounts({ type, filters, stats, total: result.total, charted }),
    page: result.page,
    itemTitle: filters.item ? historyItemTitle(filters.item, result.plays.at(0)) : undefined,
  };
}
