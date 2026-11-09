import { apiQueue } from '../../../api/apiQueue.ts';
import { rawApiFetch } from '../../../api/rawApiFetch.ts';
import { listItemRowsSchema } from '../../../lists/listItemRowsSchema.ts';
import type { FranchiseMovie } from './FranchiseMovie.ts';
import { toFranchiseMovies } from './toFranchiseMovies.ts';

type LoadFranchiseMoviesParams = {
  id: number;
  fetch?: typeof globalThis.fetch;
};

/** A franchise's movies with their release dates and posters, in one read. Throws when it fails. */
export async function loadFranchiseMovies({
  id,
  fetch = globalThis.fetch,
}: LoadFranchiseMoviesParams): Promise<readonly FranchiseMovie[]> {
  const path = `/lists/${id}/items/movie?extended=full&limit=250`;
  const response = await apiQueue.run(() => rawApiFetch({ fetch, path }));
  if (response.status !== 200) throw new Error(`${path} returned ${response.status}`);
  const rows = listItemRowsSchema.safeParse(await response.json());
  if (!rows.success) throw new Error(`${path} returned an unexpected shape`);
  return toFranchiseMovies(rows.data);
}
