import { api } from '../../api/api.ts';
import { toListRow } from '../../lists/toListRow.ts';
import { fetchBuiltInItems } from '../lists/fetchBuiltInItems.ts';
import { toBuiltInRow } from '../lists/toBuiltInRow.ts';
import type { UserListRow } from '../lists/UserListRow.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import { profileResponseSchema } from '../profileResponseSchema.ts';
import { toProfileUser } from '../toProfileUser.ts';
import type { ProgressList } from './readProgressList.ts';

/** What the progress page's list band shows of the list. */
export type ProgressListRow = Pick<UserListRow, 'href' | 'name' | 'owner' | 'posters'>;

type Params = {
  fetch: typeof globalThis.fetch;
  token: string | null;
  list: ProgressList;
  /** The progress page's own profile: the owner of the viewer's own watchlist or favorites, read already. */
  profile: ProfileUser;
};

const BUILT_IN_TYPES = { watchlist: 'movie,show,season,episode', favorites: 'movie,show' } as const;

async function readOwner(client: ReturnType<typeof api>, slug: string): Promise<ProfileUser | null> {
  const response = await client.users.profile({ params: { id: slug }, query: { extended: 'full,vip' } });
  if (response.status !== 200) return null;
  const parsed = profileResponseSchema.safeParse(response.body);
  return parsed.success ? toProfileUser(parsed.data) : null;
}

/**
 * The list `?list=` narrows progress to, for the band under the subnav that names it. A personal
 * list reads its summary, public first so the worker's cache answers, then with the token for a private one. The
 * watchlist and favorites read their first five items, and someone else's reads its owner's profile. Null when the
 * list can't be read, so the band stays out.
 */
export async function loadProgressListRow({ fetch, token, list, profile }: Params): Promise<ProgressListRow | null> {
  if (list.kind === 'personal') {
    const read = (viewer: string | null) =>
      api({ fetch, token: viewer }).lists.summary({ params: { id: String(list.id) }, query: { extended: 'images' } });
    const anonymous = await read(null);
    const summary = anonymous.status !== 200 && token ? await read(token) : anonymous;
    return summary.status === 200 ? toListRow(summary.body) : null;
  }

  const [items, owner] = await Promise.all([
    fetchBuiltInItems(fetch, { id: list.owner, kind: list.kind, type: BUILT_IN_TYPES[list.kind] }, token),
    list.owner === profile.slug ? profile : readOwner(api({ fetch, token }), list.owner),
  ]);
  return owner ? toBuiltInRow({ kind: list.kind, profile: owner, ...items }) : null;
}
