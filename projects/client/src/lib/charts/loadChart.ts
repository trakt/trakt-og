import { error, redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { extractPageMeta } from '../api/extractPageMeta.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { DateOrder } from '../utils/formatDate.ts';
import { parseAdvancedFilters } from '../components/filters/advancedFilters.ts';
import { advancedFiltersQuery } from '../components/filters/advancedFiltersQuery.ts';
import { type FilterSource, toFilterSources } from '../components/filters/watchNowFilter.ts';
import { type FadeHide, parseFadeHide } from '../components/filters/fadeHide.ts';
import { favoriteSlugs } from '../components/watchnow/watchNow.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import { recommendationFilters } from './chartFilters.ts';
import { type ChartAlias, chartAliases, type ChartName, isChartAlias, isPeriodChart } from './chartNames.ts';
import { type ChartPeriod, chartPeriod } from './chartPeriod.ts';
import { fetchLiveNow } from './fetchLiveNow.ts';
import { chartPageCount } from './chartPageCount.ts';
import { type ChartPageRequest, chartPageRequests } from './chartPageRequests.ts';
import { type ChartPageSize, chartPageSize } from './chartPageSize.ts';
import { type ChartRow, toChartCard } from './toChartCard.ts';

export type MediaType = 'shows' | 'movies';

type LoadChartParams = {
  fetch: typeof fetch;
  /** Recommendations need it, and the hide menu's watched and watchlisted options send it. */
  token: string | null;
  /** The request's cookies, for the fade and hide menu. */
  cookies: { get: (name: string) => string | undefined };
  /** The layout's data, for the viewer's date format and watch-now country. */
  parent: () => Promise<{ datePreferences: { order: DateOrder }; settings: ViewerSettings | null }>;
  url: URL;
  type: MediaType;
  chart: ChartName | ChartAlias;
  /** The optional path segment after a period chart. */
  period?: string;
};

type Query = {
  extended: 'full,images';
  page: number;
  limit: number;
  ignore_watched?: true;
  ignore_watchlisted?: true;
  // The advanced filters. @trakt/api 0.6.0's chart contracts only know some of them.
  [filter: string]: string | number | boolean | undefined;
};

// Page 1's opening cards and grid. Recommendations come as one page, so they ask for this many.
const firstPage = ({ podium, grid }: ChartPageSize) => podium + grid;

type Rows = { headers: Headers; rows: readonly ChartRow[] };

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return parsed > 0 ? parsed : fallback;
}

type Client = ReturnType<typeof api>;

// Popular rows are the bare show or movie, so they're wrapped to look like the other charts' rows.
async function fetchPopular(client: Client, type: MediaType, query: Query): Promise<Rows | null> {
  if (type === 'shows') {
    const response = await client.shows.popular({ query });
    return response.status === 200
      ? { headers: response.headers, rows: response.body.map((show) => ({ show })) }
      : null;
  }

  const response = await client.movies.popular({ query });
  return response.status === 200
    ? { headers: response.headers, rows: response.body.map((movie) => ({ movie })) }
    : null;
}

// `@trakt/api` has no contract for the worker's `/shows|movies/recommendations`. There's no paging, so the paging
// headers are dropped. The API hides watched items by default.
async function fetchRecommendations(
  fetch: typeof globalThis.fetch,
  token: string,
  type: MediaType,
  filters: Record<string, string>,
) {
  const limit = firstPage(chartPageSize('recommendations'));
  const search = new URLSearchParams({ extended: 'full,images', limit: `${limit}`, ...filters });
  const response = await rawApiFetch({ fetch, token, path: `/${type}/recommendations?${search}` });
  if (response.status === 401) return 'signed-out';
  if (!response.ok) return null;

  const rows: ChartRow[] = await response.json();
  return { headers: new Headers(), rows };
}

const watchNowCountry = (settings: ViewerSettings | null) =>
  settings?.browsing?.watchnow?.country?.toLowerCase() || 'us';

// Watch-now routes are public, so no token goes with it. A failure only costs the sidebar its tiles.
const fetchSources = (fetch: typeof globalThis.fetch, country: string): Promise<Map<string, FilterSource>> =>
  rawApiFetch({ fetch, path: `/watchnow/sources/${country}` })
    .then(async (response) => (response.ok ? toFilterSources(await response.json(), country) : new Map()))
    .catch(() => new Map());

// The chart's own pages, which don't line up with the API's.
const pageMeta = (page: number, total: number) => ({
  type: 'paginated' as const,
  current: Math.min(page, total),
  total,
});

function signIn(url: URL): never {
  redirect(302, `/auth/signin?redirect_to=${encodeURIComponent(url.pathname)}`);
}

async function fetchRows(
  client: Client,
  type: MediaType,
  chart: Exclude<ChartName, 'recommendations'>,
  period: ChartPeriod,
  query: Query,
): Promise<Rows | null> {
  if (chart === 'popular') return fetchPopular(client, type, query);
  if (isPeriodChart(chart)) {
    const response = await client[type][chart === 'library' ? 'collected' : chart]({ params: { period }, query });
    return response.status === 200 ? { headers: response.headers, rows: response.body } : null;
  }

  const response = await client[type][chart]({ query });
  return response.status === 200 ? { headers: response.headers, rows: response.body } : null;
}

// One chart page from its API pages, each from its `skip`. The first one's headers carry the counts.
async function fetchPage(
  requests: readonly ChartPageRequest[],
  fetchPart: (part: { page: number; limit: number }) => Promise<Rows | null>,
): Promise<Rows | null> {
  const parts = await Promise.all(requests.map(({ page, limit }) => fetchPart({ page, limit })));
  const [first] = parts;
  if (!first || parts.some((part) => !part)) return null;

  return { headers: first.headers, rows: parts.flatMap((part, i) => part?.rows.slice(requests.at(i)?.skip) ?? []) };
}

/**
 * Loads one chart page for SSR. The public charts go without the user's token: a stale cookie token would get a 401
 * from the worker for data that doesn't depend on it. Recommendations need one, and send a signed-out viewer to
 * sign in.
 */
export async function loadChart(
  { fetch, token, cookies, parent, url, type, chart, period: periodParam }: LoadChartParams,
) {
  if (isChartAlias(chart)) {
    redirect(301, `/${type}/${chartAliases[chart]}${periodParam ? `/${periodParam}` : ''}${url.search}`);
  }
  // Only the period charts take a second segment: `/shows/trending/weekly` is a 404, like OG.
  if (periodParam !== undefined && !isPeriodChart(chart)) error(404, 'Not Found');

  // The period the nav links keep. The charts without one link to the weekly default, as in OG.
  const period = chartPeriod(periodParam);
  const page = chart === 'recommendations' ? 1 : positiveInt(url.searchParams.get('page'), 1);
  // OG's `limit` param still sets plain pages of that size. Otherwise page 1 holds the opening cards and a grid.
  const size = chartPageSize(chart);
  const limit = url.searchParams.has('limit') ? positiveInt(url.searchParams.get('limit'), firstPage(size)) : undefined;
  const requests = limit ? [{ page, limit, skip: 0 }] : chartPageRequests(page, size);

  // OG's `filter-fade-shows-*` and `filter-hide-shows-*`, one cookie a menu section. The page fades and hides by the
  // overlay; the API also drops the `apiHideOptions` it runs natively, so those pages stay full.
  const fadeHide: FadeHide = {
    fade: parseFadeHide(cookies.get(`filter-fade-${type}`)),
    hide: parseFadeHide(cookies.get(`filter-hide-${type}`)),
  };
  // The advanced filters go to the API as they are in the URL, so SSR renders the filtered chart.
  const filters = parseAdvancedFilters(url.searchParams);
  const filterQuery = advancedFiltersQuery(filters, chart === 'recommendations' ? recommendationFilters : undefined);
  const query = { extended: 'full,images' as const, ...filterQuery };
  const ignore = {
    ...(fadeHide.hide.includes('watched') && { ignore_watched: true as const }),
    ...(fadeHide.hide.includes('watchlisted') && { ignore_watchlisted: true as const }),
  };

  const publicRows = (chart: Exclude<ChartName, 'recommendations'>) =>
    fetchPage(requests, (part) => fetchRows(api({ fetch }), type, chart, period, { ...query, ...part }));
  // A stale token fails the viewer's request, so the page falls back to the public one and the overlay hides.
  const viewerRows = async (chart: Exclude<ChartName, 'recommendations'>) =>
    (await fetchPage(
      requests,
      (part) => fetchRows(api({ fetch, token }), type, chart, period, { ...query, ...ignore, ...part }),
    )) ?? publicRows(chart);

  // Watch now filters by the viewer's country and favorites, which the API reads from their token.
  const viewer = Object.keys(ignore).length > 0 || filters.watchnow.length > 0;
  // Filtered, the sidebar counts "120 of 735 shows", so the chart's unfiltered size comes along: one row, public.
  const filtered = Object.keys(filterQuery).length > 0;
  const layout = parent();
  const [response, { datePreferences, settings }, filterSources, unfiltered, live] = await Promise.all([
    chart === 'recommendations'
      ? (token ? fetchRecommendations(fetch, token, type, filterQuery) : signIn(url))
      : token && viewer
      ? viewerRows(chart)
      : publicRows(chart),
    layout,
    // The sidebar shows watch-now filters as service tiles, so it needs the country's services.
    filters.watchnow.length > 0
      ? layout.then(({ settings }) => fetchSources(fetch, watchNowCountry(settings)))
      : undefined,
    chart !== 'recommendations' && filtered
      ? fetchRows(api({ fetch }), type, chart, period, { extended: 'full,images', page: 1, limit: 1 })
      : undefined,
    chart === 'trending' ? fetchLiveNow(fetch) : null,
  ]);
  if (response === 'signed-out') signIn(url);
  if (!response) error(502, 'The Trakt API could not load this chart.');

  const { headers } = response;
  const country = watchNowCountry(settings);
  const favorites = favoriteSlugs(settings?.browsing?.watchnow?.favorites ?? [], country, country);
  // Only the picked services go to the page: the panel fetches the whole list itself when it opens.
  const picked = new Set(filters.watchnow.flatMap((value) => (value === 'favorites' ? favorites : [value])));

  return {
    type,
    chart,
    period,
    fadeHide,
    filters,
    filterSources: filterSources && new Map([...filterSources].filter(([slug]) => picked.has(slug))),
    watchNowCountry: country,
    watchNowFavorites: favorites,
    cards: response.rows.map((row) => toChartCard(row, { chart, now: new Date(), order: datePreferences.order })),
    page: limit || !headers.has('x-pagination-item-count')
      ? extractPageMeta(headers, page)
      : pageMeta(page, chartPageCount(positiveInt(headers.get('x-pagination-item-count'), 0), size)),
    /** The chart's size, for the sidebar's count. Recommendations send no paging, so theirs is 0. */
    itemCount: positiveInt(headers.get('x-pagination-item-count'), 0),
    /** Without filters: what the count is out of. Left out when nothing is filtered or that request failed. */
    totalCount: unfiltered ? positiveInt(unfiltered.headers.get('x-pagination-item-count'), 0) : undefined,
    /** Everyone watching something on the chart right now. Only trending sends it. */
    watcherCount: positiveInt(headers.get('x-trending-user-count'), 0),
    /** Trending's Live now: shows against movies. Null on the other charts or when either didn't load. */
    live,
    /** The sidebar's own state, so SSR renders it as the viewer left it, like the calendar's. */
    sidebar: {
      collapsed: cookies.get('sidebar_collapsed') !== undefined,
      filters: cookies.get('sidebar_filters') !== 'closed',
      live: cookies.get('sidebar_live') !== 'closed',
      following: cookies.get('sidebar_following') !== 'closed',
    },
  };
}
