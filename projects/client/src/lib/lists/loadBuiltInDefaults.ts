import { listItemRowsSchema } from './listItemRowsSchema.ts';
import type { BuiltInListKind } from './toBuiltInListView.ts';

/**
 * The owner's default sort for their watchlist or favorites. The API has no read for it, so one item's read answers
 * with it in `X-Sort-By` and `X-Sort-How`. Throws when it can't be read.
 */
export async function loadBuiltInDefaults({
  kind,
  request,
}: {
  kind: BuiltInListKind;
  request: (path: string) => Promise<Response>;
}): Promise<{ by: string; how: 'asc' | 'desc' }> {
  const response = await request(`/users/me/${kind}?limit=1`);
  if (!response.ok) throw new Error('Unavailable defaults');
  listItemRowsSchema.parse(await response.json());
  return {
    by: response.headers.get('x-sort-by') ?? 'rank',
    how: response.headers.get('x-sort-how') === 'desc' ? 'desc' : 'asc',
  };
}
