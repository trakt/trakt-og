import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { watchedItemsSchema } from './watchedItemsSchema.ts';

type Params = {
  fetch: typeof fetch;
  token?: string | null;
  id: string;
};

// The worker's MAX_LIMIT.
const PAGE_SIZE = 250;
// ponytail: 8 pages is 2,000 shows or movies (a 1,787-movie account measured 8 pages of about 520 KB, 0.5s each, the
// seven after the first in parallel). Past that, All Time ranks the 2,000 most recently watched; page further if
// the worker ever gets a sort.
const MAX_PAGES = 8;

async function readWatched({ fetch, token, id }: Params, type: 'shows' | 'movies') {
  const page = async (n: number) => {
    const query = new URLSearchParams({ extended: 'full', limit: String(PAGE_SIZE), page: String(n) });
    const response = await rawApiFetch({
      fetch,
      token,
      path: `/users/${encodeURIComponent(id)}/watched/${type}?${query}`,
    });
    if (response.status !== 200) return { count: 0, rows: [] };
    const rows = watchedItemsSchema.safeParse(await response.json().catch(() => null));
    return { count: Number(response.headers.get('x-pagination-page-count')) || 1, rows: rows.success ? rows.data : [] };
  };

  const first = await page(1);
  const rest = await Promise.all(Array.from({ length: Math.min(first.count, MAX_PAGES) - 1 }, (_, i) => page(i + 2)));
  return [first, ...rest].flatMap(({ rows }) => rows);
}

/**
 * The whole watched shows and movies lists, for the profile's boxes and its Most Watched All Time ranks. The worker
 * only orders them by last watched, so every page is read: the profile's slowest read.
 */
export async function fetchWatchedLists(params: Params) {
  const [shows, movies] = await Promise.all([readWatched(params, 'shows'), readWatched(params, 'movies')]);
  return { shows, movies };
}
