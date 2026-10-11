import { api } from '../../api/api.ts';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { peopleThisMonthSchema } from './peopleThisMonthSchema.ts';
import type { searchTypes } from './searchTypes.ts';
import { toBirthdayRows } from './toBirthdayRows.ts';
import { type SearchRow, toSearchRow } from './toSearchRow.ts';

type SearchTrendingParams = {
  type: (typeof searchTypes)[number];
  /** The viewer's date, `YYYY-MM-DD`, for People's birthdays. */
  today: string;
  fetch?: typeof fetch;
  signal?: AbortSignal;
};

/** A titled list of rows for the dropdown before anything is typed. */
export type SearchTrending = { readonly label: string; readonly rows: readonly SearchRow[] };

// The API keeps what's searched most for shows and movies only: "people" comes back as shows, and a combined type as
// just its first. Shows & Movies asks for both and merges them by search count, like v3.
const KINDS: Readonly<Record<string, readonly ('movies' | 'shows')[]>> = {
  '': ['movies', 'shows'],
  shows: ['shows'],
  movies: ['movies'],
};
const SHOWN = 5;

// A failed list throws, so the dropdown tries again next time instead of keeping an empty one.
const failed = () => {
  throw new Error('The search dropdown list did not load.');
};

async function mostSearched(
  client: ReturnType<typeof api>,
  kinds: readonly ('movies' | 'shows')[],
  signal?: AbortSignal,
) {
  const responses = await Promise.all(kinds.map((kind) =>
    client.search.trending({
      params: { type: kind },
      query: { limit: SHOWN, extended: 'full,images' },
      fetchOptions: { signal },
    })
  ));
  if (responses.some((response) => response.status !== 200)) failed();

  return responses
    .flatMap((response) => (response.status === 200 ? response.body : []))
    .toSorted((a, b) => b.count - a.count)
    .map((hit) =>
      hit.type === 'movie'
        ? toSearchRow({ type: 'movie', score: hit.count, movie: hit.movie })
        : hit.type === 'show'
        ? toSearchRow({ type: 'show', score: hit.count, show: hit.show })
        : null
    )
    .filter((row) => row !== null)
    .slice(0, SHOWN);
}

// Lists have their own trending chart: the lists people are liking and commenting on now.
async function trendingLists(client: ReturnType<typeof api>, signal?: AbortSignal) {
  const response = await client.lists.trending({ query: { limit: SHOWN, extended: 'full' }, fetchOptions: { signal } });
  if (response.status !== 200) return failed();
  return response.body
    .map(({ list }) => toSearchRow({ type: 'list', score: 0, list }))
    .filter((row) => row !== null);
}

// The API keeps no trending people, so People shows this month's birthdays, like v3's search.
async function birthdays({ fetch, signal, today }: Pick<SearchTrendingParams, 'fetch' | 'signal' | 'today'>) {
  const response = await rawApiFetch({ fetch, path: '/people/this_month?extended=full,images', init: { signal } });
  if (response.status !== 200) return failed();
  const people = peopleThisMonthSchema.safeParse(await response.json().catch(() => null));
  return people.success ? toBirthdayRows(people.data, today) : failed();
}

/**
 * What the header dropdown lists for a type before anything is typed: the most searched shows and movies, the trending
 * lists, or this month's birthdays for People. The other types have nothing.
 */
export async function searchTrending({ type, today, fetch, signal }: SearchTrendingParams): Promise<SearchTrending> {
  const client = api({ fetch });
  const kinds = KINDS[type.slug];
  if (kinds) return { label: 'Most Searched', rows: await mostSearched(client, kinds, signal) };
  if (type.slug === 'lists') return { label: 'Trending Lists', rows: await trendingLists(client, signal) };
  if (type.slug === 'people') return { label: 'Birthdays This Month', rows: await birthdays({ fetch, signal, today }) };
  return { label: '', rows: [] };
}
