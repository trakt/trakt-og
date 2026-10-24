import { api } from '../../api/api.ts';
import { listItemsSchema } from '../../users/lists/listItemsSchema.ts';
import { toBuiltInRow } from '../../users/lists/toBuiltInRow.ts';
import type { ProfileUser } from '../../users/ProfileUser.ts';
import type { ListCommentsTarget } from './ListCommentsTarget.ts';
import { emptyListComments, readListComments } from './readListComments.ts';
import { toListCommentsQuery } from './toListCommentsQuery.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  parent: () => Promise<{ profile: ProfileUser }>;
  locals: { token: string | null };
  params: { id: string };
  url: URL;
  kind: 'watchlist' | 'favorites';
};

/** `/users/:id/watchlist/comments` and `/favorites/comments`. */
export async function loadBuiltInListComments({ fetch, parent, locals, params, url, kind }: Params) {
  const query = toListCommentsQuery(url.searchParams);
  const request = { params: { id: params.id, sort: query.sort }, query: { page: query.page, limit: query.limit } };
  const readItems = (token: string | null) =>
    api({ fetch, token }).users[kind].typedSorted({
      params: { id: encodeURIComponent(params.id), type: 'all', sort_by: 'rank', sort_how: 'asc' },
      query: { extended: 'images', limit: 4 },
    });
  const [initial, itemsInitial, { profile }] = await Promise.all([
    api({ fetch }).users[kind].comments(request),
    readItems(null),
    parent(),
  ]);
  const name = kind === 'watchlist' ? 'Watchlist' : 'Favorites';
  const target = (id: number | null, posters: ListCommentsTarget['posters'] = []): ListCommentsTarget => ({
    title: name,
    fullTitle: `${profile.displayName}'s ${name}`,
    href: `/users/${profile.slug}/${kind}`,
    id,
    // OG checks `allow_comments` only on lists that have one; these have none to read.
    allowComments: false,
    posters,
  });
  if (profile.isLocked) return { sort: query.sort, list: target(null), ...emptyListComments(query) };

  // Public reads stay token-free; a private profile already authorized by its frame needs the viewer's cookie.
  const [response, itemsResponse] = profile.isPrivate && locals.token
    ? await Promise.all([
      api({ fetch, token: locals.token }).users[kind].comments(request),
      readItems(locals.token),
    ])
    : [initial, itemsInitial];
  const comments = readListComments({ response, query });
  const items = itemsResponse.status >= 200 && itemsResponse.status < 300
    ? listItemsSchema.safeParse(itemsResponse.body)
    : null;
  const posters = toBuiltInRow({ kind, profile, items: items?.success ? items.data : [], itemCount: 0 }).posters;
  return { sort: query.sort, list: target(comments.listId, posters.slice(0, 4)), ...comments };
}
