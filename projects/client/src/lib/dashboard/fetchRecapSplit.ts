import type { api } from '../api/api.ts';
import type { RecapSpan } from './RecapRibbon.ts';
import type { RecapSplit, RecapTally } from './RecapSplit.ts';

type FetchRecapSplitParams = {
  client: ReturnType<typeof api>;
  span: RecapSpan;
};

// The worker's MAX_LIMIT.
const PAGE_SIZE = 250;
// 1,000 plays. Past that the shows and movies go uncounted, and the card shows only the plays.
const MAX_PAGES = 4;

/** The plays from page 1's item count, and the distinct titles across every page while there are few enough. */
async function tally<R extends { status: number; headers: Headers }>(
  page: (n: number) => Promise<R>,
  ids: (response: R) => readonly number[],
): Promise<RecapTally> {
  const first = await page(1);
  if (first.status !== 200) throw new Error('A page of history did not load');
  const plays = Number(first.headers.get('x-pagination-item-count')) || 0;
  const pages = Number(first.headers.get('x-pagination-page-count')) || 1;
  if (pages > MAX_PAGES) return { plays, titles: null };

  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => page(i + 2)));
  if (rest.some(({ status }) => status !== 200)) throw new Error('A page of history did not load');
  return { plays, titles: new Set([first, ...rest].flatMap(ids)).size };
}

/**
 * The plays in one of the recap strip's spans, split into episodes and movies, with how many shows and movies they
 * came from. The strip loads it when a month is first hovered, so the dashboard's own load stays at one count a month.
 */
export async function fetchRecapSplit({ client, span }: FetchRecapSplitParams): Promise<RecapSplit> {
  const query = { start_at: span.start, end_at: span.end, limit: PAGE_SIZE };
  const [episodes, movies] = await Promise.all([
    tally(
      (page) => client.users.history.episodes({ params: { id: 'me' }, query: { ...query, page } }),
      (response) => (response.status === 200 ? response.body.map(({ show }) => show.ids.trakt) : []),
    ),
    tally(
      (page) => client.users.history.movies({ params: { id: 'me' }, query: { ...query, page } }),
      (response) => (response.status === 200 ? response.body.map(({ movie }) => movie.ids.trakt) : []),
    ),
  ]);
  return { episodes, movies };
}
