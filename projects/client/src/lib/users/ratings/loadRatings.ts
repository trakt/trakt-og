import { error } from '@sveltejs/kit';
import { api } from '../../api/api.ts';
import { extractPageMeta } from '../../api/extractPageMeta.ts';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { type FadeHide, parseFadeHide } from '../../components/filters/fadeHide.ts';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import { readProfileTab } from '../readProfileTab.ts';
import { toHistoryDays } from '../history/toHistoryCard.ts';
import { ratingQuery } from './ratingQuery.ts';
import { ratingsPath } from './ratingsPath.ts';
import { canonicalRedirect } from '../../routing/canonicalRedirect.ts';
import { ratingRowsSchema } from './ratingRowsSchema.ts';
import { sortRatings } from './sortRatings.ts';
import { toRatingCard } from './toRatingCard.ts';
import type { RatingCard } from './RatingCard.ts';
import { positiveInt } from '../../utils/positiveInt.ts';

type Params = {
  fetch: typeof fetch;
  locals: { token: string | null };
  params: { id: string; type?: string; filters?: string };
  url: URL;
  cookies: { get: (name: string) => string | undefined };
  parent: () => Promise<{ profile: ProfileUser; isSelf: boolean; datePreferences: DatePreferences }>;
};

async function read({
  fetch,
  id,
  token,
  query,
  current,
  limit,
}: {
  fetch: typeof globalThis.fetch;
  id: string;
  token: string | null;
  query: ReturnType<typeof ratingQuery>;
  current: number;
  limit: number;
}) {
  const localSort = query.by !== 'added' || query.how !== 'asc';
  const client = api({ fetch, token });
  const request = { params: { id }, query: { extended: 'full,images' as const, page: current, limit } };
  if (!localSort && query.rating !== 'all') {
    const response = await client.users.ratings.typedRating({
      ...request,
      params: { id, type: query.type, rating: query.rating },
    });
    return { status: response.status, body: response.body, headers: response.headers };
  }
  if (!localSort && query.type !== 'seasons') {
    const response = await client.users.ratings[query.type](request);
    return { status: response.status, body: response.body, headers: response.headers };
  }
  // The numeric-limit contract cannot express the worker's limit=all; unfiltered seasons has no contract.
  const pathType = query.type === 'all' && query.rating === 'all' ? '' : `/${query.type}`;
  const stars = query.rating === 'all' ? '' : `/${query.rating}`;
  const search = new URLSearchParams({
    extended: 'full,images',
    limit: localSort ? 'all' : String(limit),
    ...(localSort ? {} : { page: String(current) }),
  });
  const response = await rawApiFetch({
    fetch,
    token,
    path: `/users/${encodeURIComponent(id)}/ratings${pathType}${stars}?${search}`,
  });
  return {
    status: response.status,
    body: response.ok ? await response.json().catch(() => null) : null,
    headers: response.headers,
  };
}

/**
 * One read per `readProfileTab`: someone else's public ratings go without the token alongside the frame's load, and
 * your own, or a private profile the viewer may see, are read with it. SSR never refreshes. An unknown or default segment 301s to the
 * page's own spelling.
 */
export async function loadRatings({ fetch, locals, params, url, cookies, parent }: Params) {
  const query = ratingQuery(params.type ? `${params.type}/${params.filters ?? ''}` : params.filters);
  const current = positiveInt(url.searchParams.get('page'), 1);
  const limit = Math.min(positiveInt(url.searchParams.get('limit'), 60), 250);
  const request = { id: params.id, query, current, limit };
  const {
    frame: { isSelf, datePreferences },
    result,
  } = await readProfileTab({
    fetch,
    token: locals.token,
    frame: parent(),
    read: (credentials) =>
      read({ ...request, ...credentials }).catch(() => ({ status: 502, body: null, headers: new Headers() })),
  });
  const base = `/users/${encodeURIComponent(params.id)}/ratings`;
  canonicalRedirect({
    requested: [base, params.type, params.filters].filter(Boolean).join('/'),
    canonical: `${base}${ratingsPath(query)}`,
    url,
  });
  const shell = {
    query,
    isSelf,
    datePreferences,
    fadeHide: { fade: parseFadeHide(cookies.get('filter-fade-ratings')), hide: [] } satisfies FadeHide,
    dividers: cookies.get('filter-hide-dividers') !== '1',
  };
  if (!result) {
    return { ...shell, cards: [] as RatingCard[], days: [], total: 0, page: extractPageMeta(new Headers(), current) };
  }
  if (result.status === 404) error(404, 'Page Not Found');
  if (result.status !== 200) error(502, 'Trakt is having trouble loading these ratings.');
  const parsed = ratingRowsSchema.safeParse(result.body);
  if (!parsed.success) error(502, 'Trakt is having trouble loading these ratings.');
  const localSort = query.by !== 'added' || query.how !== 'asc';
  const total = localSort
    ? parsed.data.length
    : positiveInt(result.headers.get('x-pagination-item-count'), parsed.data.length);
  const headers = localSort
    ? new Headers({
        'x-pagination-page': String(current),
        'x-pagination-page-count': String(Math.max(1, Math.ceil(total / limit))),
      })
    : result.headers;
  const page = extractPageMeta(headers, current);
  const pageNumber = page.current;
  const rows = localSort
    ? sortRatings(parsed.data, query).slice((pageNumber - 1) * limit, pageNumber * limit)
    : parsed.data;
  const cards = rows
    .map((row) => toRatingCard(row, { ...query, datePreferences }))
    .filter((card): card is RatingCard => card !== null);
  return { ...shell, cards, days: query.by === 'added' ? toHistoryDays(cards, datePreferences) : [], total, page };
}
