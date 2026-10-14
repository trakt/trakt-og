import { z } from 'zod/v4';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import type { ListTarget } from './ListTarget.ts';
import { loadListCatalog } from './loadListCatalog.ts';

// Built-in rows (watchlist, favorites) can come without a list id.
const membershipSchema = z.array(z.object({ ids: z.object({ trakt: z.number().nullish() }), type: z.string() }));

/**
 * Which of the viewer's lists hold this item. Seasons and episodes read list ids only: their watchlist state comes
 * from the overlay the page already loaded, so `watchlisted` is left out.
 */
async function membership(fetch: typeof globalThis.fetch, target: ListTarget) {
  if (target.type === 'season' || target.type === 'episode') {
    const response = await rawApiFetch({ fetch, path: `/v3/${target.type}s/${target.id}/me/lists` });
    if (!response.ok) throw new Error('List membership unavailable');
    return { ids: new Set(z.array(z.number()).parse(await response.json())), watchlisted: undefined };
  }
  const ids = new Set<number>();
  let watchlisted = false;
  let page = 1;
  let pages: number;
  do {
    const response = await rawApiFetch({
      fetch,
      path: `/${target.type}s/${target.id}/listed?limit=100&page=${page}`,
    });
    if (!response.ok) throw new Error('List membership unavailable');
    membershipSchema.parse(await response.json()).forEach((row) => {
      if (row.type === 'watchlist') watchlisted = true;
      else if (row.type === 'personal' && row.ids.trakt) ids.add(row.ids.trakt);
    });
    pages = Number(response.headers.get('X-Pagination-Page-Count') ?? 1);
    page += 1;
  } while (page <= pages);
  return { ids, watchlisted };
}

/** Fresh own and collaborative lists, and this item's membership, when the picker opens. */
export async function loadPickerLists({ fetch, target }: { fetch: typeof globalThis.fetch; target: ListTarget }) {
  const [lists, selected] = await Promise.all([
    loadListCatalog(fetch),
    membership(fetch, target),
  ]);
  return {
    lists: lists.map((list) => ({ ...list, selected: selected.ids.has(list.id) })),
    watchlisted: selected.watchlisted,
  };
}
