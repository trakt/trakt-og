import { z } from 'zod/v4';
import type { HistoryPlay } from './HistoryPlay.ts';

const historySchema = z.array(z.object({ id: z.number(), watched_at: z.string() }));

/**
 * `/sync/history/{movies|episodes}/:id?limit=1`: the viewer's most recent play, for a page that has no history id.
 * Throws when there's none, since the caller only asks after seeing one.
 */
export async function fetchLatestPlay({
  target,
  request,
}: {
  target: { type: 'movie' | 'episode'; id: number };
  request: (path: string) => Promise<Response>;
}): Promise<HistoryPlay> {
  const response = await request(`/sync/history/${target.type}s/${target.id}?limit=1`);
  if (!response.ok) throw new Error(String(response.status));
  const row = historySchema.parse(await response.json()).at(0);
  if (!row) throw new Error('Play not found');
  return { id: row.id, watchedAt: row.watched_at };
}
