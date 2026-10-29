import { api } from '../../api/api.ts';
import { listItemsSchema } from './listItemsSchema.ts';
import { withViewer } from './withViewer.ts';

/** The first five items and the total, for a watchlist or favorites row. Either failing leaves the row empty. */
export async function fetchBuiltInItems(
  fetch: typeof globalThis.fetch,
  { id, kind, type }: { id: string; kind: 'watchlist' | 'favorites'; type: string },
  token: string | null,
) {
  const response = await withViewer(token, (viewer) =>
    api({ fetch, token: viewer }).users[kind].typedSorted({
      params: { id, type, sort_by: 'rank', sort_how: 'asc' },
      query: { limit: 5, extended: 'images' },
    }),
  ).catch(() => null);
  if (response?.status !== 200) return { items: [], itemCount: 0 };
  const items = listItemsSchema.safeParse(response.body);
  return {
    items: items.success ? items.data : [],
    itemCount: Number(response.headers.get('x-pagination-item-count')) || 0,
  };
}
