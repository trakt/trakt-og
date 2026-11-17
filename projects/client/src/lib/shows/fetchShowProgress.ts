import { api } from '../api/api.ts';
import { okBody } from '../api/okBody.ts';
import type { ShowProgress } from './toShowProgress.ts';

/**
 * The viewer's progress on a show, with the episodes' air dates the cards need. Null when the read fails or the
 * sign-in is stale: the page keeps what a signed-out visit sees. Run in the browser, where `fetch` carries the sign-in.
 */
export function fetchShowProgress({
  fetch,
  showId,
}: {
  fetch: typeof globalThis.fetch;
  showId: number;
}): Promise<ShowProgress | null> {
  return okBody(api({ fetch }).shows.progress.watched({ params: { id: String(showId) }, query: { extended: 'full' } }));
}
