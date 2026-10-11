import { api } from '../../api/api.ts';
import type { searchTypes } from './searchTypes.ts';
import { type SearchRow, toSearchRow } from './toSearchRow.ts';

type SearchTrendingParams = {
  type: (typeof searchTypes)[number];
  fetch?: typeof fetch;
  signal?: AbortSignal;
};

// The API keeps what's searched most for shows and movies only: "people" comes back as shows, and a combined type as
// just its first. Shows & Movies asks for both and merges them by search count, like v3.
const KINDS: Readonly<Record<string, readonly ('movies' | 'shows')[]>> = {
  '': ['movies', 'shows'],
  shows: ['shows'],
  movies: ['movies'],
};
const SHOWN = 5;

/** The header dropdown's most searched shows and movies for a type, before anything is typed. Other types have none. */
export async function searchTrending({ type, fetch, signal }: SearchTrendingParams): Promise<SearchRow[]> {
  const kinds = KINDS[type.slug] ?? [];
  const client = api({ fetch });
  const responses = await Promise.all(kinds.map((kind) =>
    client.search.trending({
      params: { type: kind },
      query: { limit: SHOWN, extended: 'full,images' },
      fetchOptions: { signal },
    })
  ));

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
