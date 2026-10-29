import { error } from '@sveltejs/kit';
import { api } from '../../api/api.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import { likedListsSchema } from './likedListsSchema.ts';
import { listRowsSchema } from './listRowsSchema.ts';
import type { ListsMode } from './ListsMode.ts';
import { fetchBuiltInItems } from './fetchBuiltInItems.ts';
import { toBuiltInRow } from './toBuiltInRow.ts';
import { toListsQuery } from './toListsQuery.ts';
import { toUserListRow } from './toUserListRow.ts';
import type { UserListRow } from './UserListRow.ts';
import { withViewer } from './withViewer.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  locals: { token: string | null };
  params: { id: string };
  url: URL;
  parent: () => Promise<{ profile: ProfileUser }>;
  mode: ListsMode;
};

// OG put every list on one page. The worker caps a page at 250, so the rest come in parallel, up to 2,500 lists.
const LIMIT = 250;
const MAX_PAGES = 10;

async function fetchPersonal(fetch: typeof globalThis.fetch, id: string, token: string | null) {
  const page = (n: number) =>
    withViewer(token, (viewer) =>
      api({ fetch, token: viewer }).users.lists.personal({
        params: { id },
        query: { extended: 'images', page: n, limit: LIMIT },
      }),
    );
  const first = await page(1);
  if (first.status !== 200) return { status: first.status, lists: [], likedAt: [] };

  const pageCount = Number(first.headers.get('x-pagination-page-count')) || 1;
  const pages = Math.min(pageCount, MAX_PAGES);
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => page(i + 2)));
  return {
    status: 200,
    complete: pageCount <= MAX_PAGES && rest.every((response) => response.status === 200),
    lists: [first, ...rest].flatMap((response) => (response.status === 200 ? response.body : [])),
    likedAt: [],
  };
}

async function fetchCollaborations(fetch: typeof globalThis.fetch, id: string, token: string | null) {
  const response = await withViewer(token, (viewer) =>
    api({ fetch, token: viewer }).users.lists.collaborations({ params: { id }, query: { extended: 'images' } }),
  );
  if (response.status !== 200) return { status: response.status, lists: [], likedAt: [] };
  const rows = listRowsSchema.safeParse(response.body);
  if (!rows.success) error(502, 'Trakt returned an invalid lists response.');
  return { status: 200, lists: rows.data, likedAt: [] };
}

/**
 * The lists the user liked, newest first, every page in parallel like their own. The API mixes personal and official
 * lists, so `official` keeps one kind or the other.
 */
async function fetchLiked(fetch: typeof globalThis.fetch, id: string, token: string | null, official: boolean) {
  const page = (n: number) =>
    withViewer(token, (viewer) =>
      api({ fetch, token: viewer }).users.likes({
        params: { id, type: 'lists' },
        query: { extended: 'images', page: n, limit: LIMIT },
      }),
    );
  const first = await page(1);
  if (first.status !== 200) return { status: first.status, lists: [], likedAt: [] };
  const pageCount = Number(first.headers.get('x-pagination-page-count')) || 1;
  const rest = await Promise.all(Array.from({ length: Math.min(pageCount, MAX_PAGES) - 1 }, (_, i) => page(i + 2)));
  const bodies = [first, ...rest].map((response) => (response.status === 200 ? response.body : []));
  const likes = likedListsSchema.safeParse(bodies.flat());
  if (!likes.success) error(502, 'Trakt returned an invalid lists response.');
  const kept = likes.data.filter(({ list }) => (list.type === 'official') === official);
  return { status: 200, lists: kept.map(({ list }) => list), likedAt: kept.map(({ liked_at }) => liked_at) };
}

/**
 * `/users/:id/lists`, `/users/:id/lists/collaborations`, `/users/:id/lists/liked` and `/users/:id/lists/liked/official`.
 * Personal lists come in the owner's rank order after the watchlist and favorites rows; collaborations and liked lists
 * are other people's lists, with no built-in rows. Sorting and searching happen in the browser over every row, like OG.
 */
export async function loadLists({ fetch, locals, params, url, parent, mode }: Params) {
  const id = encodeURIComponent(params.id);
  const token = locals.token;
  const [result, watchlist, favorites, { profile }] = await Promise.all([
    mode === 'personal'
      ? fetchPersonal(fetch, id, token)
      : mode === 'collaborations'
        ? fetchCollaborations(fetch, id, token)
        : fetchLiked(fetch, id, token, mode === 'liked-official'),
    mode === 'personal'
      ? fetchBuiltInItems(fetch, { id, kind: 'watchlist', type: 'movie,show,season,episode' }, token)
      : null,
    mode === 'personal' ? fetchBuiltInItems(fetch, { id, kind: 'favorites', type: 'movie,show' }, token) : null,
    parent(),
  ]);
  const query = toListsQuery(url.searchParams, mode);
  if (profile.isLocked) return { mode, query, builtIns: [], lists: [], listsComplete: false };
  if (result.status === 404) error(404, 'Page Not Found');
  if (result.status !== 200) error(502, 'Trakt is having trouble loading these lists.');

  const builtIns: UserListRow[] = [
    ...(watchlist ? [toBuiltInRow({ kind: 'watchlist', profile, ...watchlist })] : []),
    ...(favorites ? [toBuiltInRow({ kind: 'favorites', profile, ...favorites })] : []),
  ];
  return {
    mode,
    query,
    builtIns,
    listsComplete: 'complete' in result && result.complete === true,
    // Liked lists carry when they were liked, in the same order; the rest have none.
    lists: result.lists.map((list, i) => ({ ...toUserListRow(list, i + 1), likedAt: result.likedAt.at(i) })),
  };
}
