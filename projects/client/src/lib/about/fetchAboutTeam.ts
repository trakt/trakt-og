import { api } from '../api/api.ts';
import type { AboutMember } from './AboutMember.ts';
import { type AboutUserRow, toAboutMember } from './toAboutMember.ts';

type Client = ReturnType<typeof api>;

/** A member's first ten favorites in their own order, and their watch counts. Either failing leaves it empty. */
async function fetchMember(client: Client, user: AboutUserRow): Promise<AboutMember> {
  const id = user.ids.slug ?? user.username;
  const [favorites, stats] = await Promise.all([
    client.users.favorites.typedSorted({
      params: { id, type: 'movie,show', sort_by: 'rank', sort_how: 'asc' },
      query: { extended: 'full,images', limit: 10 },
    }).catch(() => null),
    client.users.stats({ params: { id } }).catch(() => null),
  ]);

  return toAboutMember({
    user,
    favorites: favorites?.status === 200 ? favorites.body : [],
    stats: stats?.status === 200 ? stats.body : null,
  });
}

/**
 * The Trakt team, in the API's order, each with their favorites and watch counts. Public routes, so no token. With no
 * team at all it throws, so the cache keeps the last good list instead of storing nothing.
 */
export async function fetchAboutTeam(fetch: typeof globalThis.fetch): Promise<AboutMember[]> {
  const client = api({ fetch });
  const team = await client.team.members({ query: { extended: 'full,images' } });
  if (team.status !== 200 || team.body.length === 0) throw new Error('No Trakt team from the API.');

  return Promise.all(team.body.map(({ user }) => fetchMember(client, user)));
}
