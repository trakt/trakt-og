import { fetchListItems } from '../../lists/loadListItems.ts';
import type { CachedShow } from '../../shows/cache/CachedShow.ts';
import { toProgressShow } from './toProgressShow.ts';

const PAGE = 250;
// fetchListItemRefs' cap: enough pages for a VIP's 5,000-item list.
const MAX_PAGES = 20;

/**
 * Every show on a list, with its summary, for `?list=` progress: OG listed every one of them, started or not. Read page
 * by page in the browser; throws when a page fails or the list is too long to read whole.
 */
export async function loadListShows({ fetch, list, now = Date.now }: {
  /** `authenticatedFetch`: a private list only reads with the viewer's token. */
  fetch: typeof globalThis.fetch;
  list: number;
  now?: () => number;
}): Promise<ReadonlyMap<number, CachedShow>> {
  const shows = new Map<number, CachedShow>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { status, rows } = await fetchListItems({
      fetch,
      token: null,
      base: `/lists/${list}/items`,
      query: { types: ['show'], genres: [], page, limit: PAGE },
      sort: { by: 'rank', how: 'asc' },
    });
    if (status !== 200) throw new Error(`List items: ${status}`);
    const fetchedAt = now();
    for (const row of rows) {
      if (row.type === 'show') shows.set(row.show.ids.trakt, toProgressShow(row.show, fetchedAt));
    }
    // A short page is the last.
    if (rows.length < PAGE) return shows;
  }
  throw new Error('List too long');
}
