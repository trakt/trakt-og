import { error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { api } from '../../api/api.ts';
import { assertOk } from '../../api/assertOk.ts';
import { extractPageMeta } from '../../api/extractPageMeta.ts';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import type { ViewerSettings } from '../../settings/ViewerSettings.ts';
import { watchNowCountry } from '../../settings/watchNowCountry.ts';
import type { ProfileUser } from '../../users/ProfileUser.ts';
import { withViewer } from '../../users/lists/withViewer.ts';
import { fetchListSummary } from '../fetchListSummary.ts';
import { listItemRowsSchema } from '../listItemRowsSchema.ts';
import { listSortHow } from '../listItemSorts.ts';
import { toListItemCard } from '../toListItemCard.ts';
import { toListQuery } from '../toListQuery.ts';
import { smartListChartHref } from './smartListChartHref.ts';
import { smartListRecipe } from './smartListRecipe.ts';
import { smartListSorts } from './smartListSorts.ts';
import { toSmartList } from './toSmartList.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  locals: { token: string | null };
  params: { id: string; slug: string };
  url: URL;
  parent: () => Promise<{
    profile: ProfileUser;
    settings?: ViewerSettings | null;
    datePreferences: DatePreferences;
  }>;
};

// The list page's own page size.
const PER_PAGE = 120;

type ItemsParams = {
  fetch: typeof globalThis.fetch;
  token: string | null;
  slug: string;
  sort: { by: string; how: string };
  page: number;
};

// A smart list's items have no list item id or listed date; their rank stands in for the id, so they read like a list's.
const smartRowsSchema = z
  .array(z.looseObject({ rank: z.number() }))
  .transform((rows) => listItemRowsSchema.parse(rows.map((row) => ({ ...row, id: row.rank, listed_at: '' }))));

async function fetchItems({ fetch, token, slug, sort, page }: ItemsParams) {
  const search = new URLSearchParams({ extended: 'full,images', page: `${page}`, limit: `${PER_PAGE}` });
  const path = `/smart-lists/${encodeURIComponent(slug)}/items/all/${sort.by}/${sort.how}?${search}`;
  const response = await rawApiFetch({ fetch, token, path });
  if (!response.ok) return { status: response.status, headers: response.headers, rows: [] };
  const rows = smartRowsSchema.safeParse(await response.json().catch(() => null));
  return { status: rows.success ? 200 : 502, headers: response.headers, rows: rows.success ? rows.data : [] };
}

/**
 * `/users/:id/smart-lists/:slug`: a smart list's definition and a page of the titles it holds today, in the chosen
 * sort. The owner's token shows their private lists; a stale one reads as a visitor.
 */
export async function loadSmartList({ fetch, locals, params, url, parent }: Params) {
  const token = locals.token;
  const query = toListQuery(url.searchParams);
  const by = smartListSorts.find((sort) => sort.by === query.sortBy)?.by ?? 'rank';
  const sort = { by, how: query.sortHow ?? listSortHow(by) };

  const [summary, items, { profile, datePreferences, settings }] = await Promise.all([
    // A list that's missing, not this user's or not the viewer's to see is an empty 204, like a list's. The read is
    // under its owner: `/smart-lists/:slug` ignores the token, so it never shows the owner their private lists.
    withViewer(token, (viewer) =>
      fetchListSummary(() =>
        api({ fetch, token: viewer }).users.smartLists.smartList.summary({
          params: { id: params.id, list_id: params.slug },
        }),
      ).then((response) => response ?? { status: 204 as const }),
    ),
    withViewer(token, (viewer) => fetchItems({ fetch, token: viewer, slug: params.slug, sort, page: query.page })),
    parent(),
  ]);
  if (profile.isLocked || [204, 401, 403, 404].includes(summary.status)) error(404, 'Smart list not found');
  assertOk(summary, 'Smart list');
  assertOk(items, 'Smart list');

  const list = toSmartList(summary.body);
  return {
    smart: list,
    sort,
    cards: items.rows.map((row) => toListItemCard(row, { sortBy: sort.by, datePreferences })),
    page: extractPageMeta(items.headers, query.page),
    recipe: smartListRecipe({ filters: list.filters, country: watchNowCountry(settings ?? null) }),
    chartHref: smartListChartHref({ list, now: new Date() }),
    datePreferences,
  };
}
