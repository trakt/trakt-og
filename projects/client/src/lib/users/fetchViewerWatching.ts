import { api } from '../api/api.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';
import type { WatchingNow } from './WatchingNow.ts';
import { toWatchingNow } from './toWatchingNow.ts';

type Client = Pick<ReturnType<typeof api>, 'users'>;

/**
 * What the signed-in viewer is checked in to or scrobbling, from the browser. Null when nothing is playing (a 204);
 * any other answer throws, so a caller keeps what it had.
 */
export async function fetchViewerWatching({
  client = api({ fetch: viewerFetch() }),
}: {
  client?: Client;
} = {}): Promise<WatchingNow | null> {
  const response = await client.users.watching({ params: { id: 'me' }, query: { extended: 'full' } });
  if (response.status === 204) return null;
  if (response.status !== 200) throw new Error(`Watching failed with ${response.status}`);
  return toWatchingNow(response.body);
}
