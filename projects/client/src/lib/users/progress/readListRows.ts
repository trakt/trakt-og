import { fetchListItems } from '../../lists/loadListItems.ts';
import type { ListItemRow } from '../../lists/listItemRowsSchema.ts';

const PAGE = 250;
// fetchListItemRefs' cap: enough pages for a VIP's 5,000-item list.
const MAX_PAGES = 20;

type ReadListRowsParams = {
  /** `authenticatedFetch`: a private list only reads with the viewer's token. */
  fetch: typeof globalThis.fetch;
  /** Where the list's items read from: `/lists/:id/items`, or `/users/:id/watchlist` and `/users/:id/favorites`. */
  base: string;
  type: 'movie' | 'show';
};

/**
 * Every item of one type on a list, for `?list=` progress, read page by page in the browser. Throws when a page fails
 * or the list is too long to read whole.
 */
export async function readListRows({ fetch, base, type }: ReadListRowsParams): Promise<readonly ListItemRow[]> {
  const rows: ListItemRow[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const read = await fetchListItems({
      fetch,
      token: null,
      base,
      query: { types: [type], genres: [], page, limit: PAGE },
      sort: { by: 'rank', how: 'asc' },
    });
    if (read.status !== 200) throw new Error(`List items: ${read.status}`);
    rows.push(...read.rows);
    // A short page is the last.
    if (read.rows.length < PAGE) return rows;
  }
  throw new Error('List too long');
}

/** Whether a list holds any item of one type: a single one-item read, for the empty tab's way across. */
export async function listHasType({ fetch, base, type }: ReadListRowsParams): Promise<boolean> {
  const read = await fetchListItems({
    fetch,
    token: null,
    base,
    query: { types: [type], genres: [], page: 1, limit: 1 },
    sort: { by: 'rank', how: 'asc' },
  });
  if (read.status !== 200) throw new Error(`List items: ${read.status}`);
  return read.rows.length > 0;
}
