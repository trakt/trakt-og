import type { ShowProgressResponse } from '@trakt/api';
import type { api } from '../api/api.ts';

/**
 * A rewatched show's whole progress for the second group of the on-deck tooltip. `/shows/:id/progress/watched` ignores
 * the rewatch reset and counts aired, completed and plays over the same episodes (no hidden seasons), with plays times
 * runtime as the time watched, as OG's tooltip did. The panel and a card's refresh both read it here, so they agree.
 * A failure leaves the group out.
 */
export async function fetchWholeShowProgress(
  client: ReturnType<typeof api>,
  showId: number,
): Promise<ShowProgressResponse | undefined> {
  const response = await client.shows.progress.watched({ params: { id: String(showId) }, query: {} })
    .catch(() => null);
  return response?.status === 200 ? response.body : undefined;
}
