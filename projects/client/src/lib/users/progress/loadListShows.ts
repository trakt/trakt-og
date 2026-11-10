import type { CachedShow } from '../../shows/cache/CachedShow.ts';
import { readListRows } from './readListRows.ts';
import { toProgressShow } from './toProgressShow.ts';

/**
 * Every show on a list, with its summary, for `?list=` progress: OG listed every one of them, started or not. Read page
 * by page in the browser; throws when a page fails or the list is too long to read whole.
 */
export async function loadListShows({
  fetch,
  base,
  now = Date.now,
}: {
  /** `authenticatedFetch`: a private list only reads with the viewer's token. */
  fetch: typeof globalThis.fetch;
  /** Where the list's items read from: `/lists/:id/items`, or `/users/:id/watchlist` and `/users/:id/favorites`. */
  base: string;
  now?: () => number;
}): Promise<ReadonlyMap<number, CachedShow>> {
  const rows = await readListRows({ fetch, base, type: 'show' });
  const fetchedAt = now();
  return new Map(
    rows.flatMap((row) => (row.type === 'show' ? [[row.show.ids.trakt, toProgressShow(row.show, fetchedAt)]] : [])),
  );
}

/** Every movie's id on a list, for `?list=` franchise progress. Throws like `loadListShows`. */
export async function loadListMovieIds({
  fetch,
  base,
}: {
  fetch: typeof globalThis.fetch;
  base: string;
}): Promise<ReadonlySet<number>> {
  const rows = await readListRows({ fetch, base, type: 'movie' });
  return new Set(rows.flatMap((row) => (row.type === 'movie' ? [row.movie.ids.trakt] : [])));
}
