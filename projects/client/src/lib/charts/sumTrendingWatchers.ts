import type { api } from '../api/api.ts';
import type { MediaType } from './loadChart.ts';

type Params = {
  client: ReturnType<typeof api>;
  type: MediaType;
  /** The chart's filters in the API's names. Left out, the whole chart. */
  filters?: Readonly<Record<string, string | boolean>>;
};

/** The API's largest page. */
const PER_PAGE = 250;
/** Shows run to about 4 pages; past this the tail is a watcher or two a title. */
const MAX_PAGES = 8;

/**
 * Everyone watching a trending chart right now, or null when its first page didn't load. The API only counts the
 * watchers of the rows it sends, so the chart is read whole, a page of 250 at a time; a later page that fails leaves
 * the count a little short rather than losing it.
 */
export async function sumTrendingWatchers({ client, type, filters = {} }: Params): Promise<number | null> {
  const read = async (page: number) => {
    const query = { ...filters, page, limit: PER_PAGE };
    const response =
      type === 'shows' ? await client.shows.trending({ query }) : await client.movies.trending({ query });
    if (response.status !== 200) return null;

    const count = (name: string) => Number.parseInt(response.headers.get(name) ?? '', 10) || 0;
    return { watchers: count('x-trending-user-count'), items: count('x-pagination-item-count') };
  };

  const first = await read(1);
  if (!first) return null;

  const pages = Math.min(Math.ceil(first.items / PER_PAGE), MAX_PAGES);
  const rest = await Promise.all(Array.from({ length: Math.max(pages - 1, 0) }, (_, i) => read(i + 2)));
  return [first, ...rest].reduce((sum, page) => sum + (page?.watchers ?? 0), 0);
}
