import { z } from 'zod/v4';
import { api } from '../../api/api.ts';
import type { UserListRow } from './UserListRow.ts';

/** Built-in rows have no summary; their comments route supplies the numeric list id on demand. */
export async function resolveRowListId({
  fetch,
  row,
}: {
  fetch: typeof globalThis.fetch;
  row: Pick<UserListRow, 'id' | 'owner' | 'kind'>;
}): Promise<number> {
  if (row.id !== null) return row.id;
  if (row.kind !== 'watchlist' && row.kind !== 'favorites') throw new Error('Missing list id');
  const response = await api({ fetch }).users[row.kind].comments({
    params: { id: encodeURIComponent(row.owner.slug), sort: 'newest' },
    query: { limit: 1 },
  });
  if (response.status < 200 || response.status >= 300) throw new Error('List unavailable');
  z.array(z.unknown()).parse(response.body);
  return z.coerce.number().int().positive().parse(response.headers.get('X-List-ID'));
}
