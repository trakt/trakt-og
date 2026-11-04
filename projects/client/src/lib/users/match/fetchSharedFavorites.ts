import { api } from '../../api/api.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';
import { toSharedFavorites } from './toSharedFavorites.ts';
import type { UserMatch } from './UserMatch.ts';

// The API compares at most this many favorites per member, so the shared ones are among them.
const COMPARED = 100;

/**
 * `limit` of the shared favorites' cards at random, read in the browser when the match dialog first opens: the owner's
 * favorites, with the viewer's token for a private profile they follow, narrowed to the shared ids.
 */
export async function fetchSharedFavorites(
  slug: string,
  shared: UserMatch['sharedFavorites'],
  limit: number,
): Promise<ReturnType<typeof toSharedFavorites>> {
  const response = await api({ fetch: viewerFetch() }).users.favorites.typedSorted({
    params: { id: slug, type: 'movie,show', sort_by: 'rank', sort_how: 'asc' },
    query: { extended: 'full,images', limit: COMPARED },
  });
  if (response.status !== 200) throw new Error(`Favorites read failed: ${response.status}`);
  return toSharedFavorites(response.body, shared, limit, Math.random);
}
