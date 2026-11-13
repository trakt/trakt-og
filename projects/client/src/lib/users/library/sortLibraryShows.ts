import type { LibraryShowRow } from './libraryRowsSchema.ts';
import type { LibrarySort, LibrarySortBy } from './librarySort.ts';

export const episodeCount = (row: LibraryShowRow) =>
  (row.seasons ?? []).reduce((sum, season) => sum + season.episodes.length, 0);

const time = (date: string | null | undefined) => (date ? Date.parse(date) || 0 : 0);
const title = (row: LibraryShowRow) => row.show.title.toLowerCase().replace(/^(the |an |a )/, '');

// Each sort's own direction: newest, A to Z, most, longest, highest.
const KEYS: Record<LibrarySortBy, (row: LibraryShowRow) => number | string> = {
  added: (row) => -time(row.last_collected_at),
  title,
  released: (row) => -time(row.show.first_aired),
  episodes: (row) => -episodeCount(row),
  runtime: (row) => -(row.show.runtime ?? 0),
  percentage: (row) => -(row.show.rating ?? 0),
  votes: (row) => -(row.show.votes ?? 0),
};

const compare = (a: number | string, b: number | string) =>
  typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b, 'en') : Number(a) - Number(b);

/** The shows in `sort`'s order, `desc` flipping it, ties A to Z. Never mutates the rows. */
export function sortLibraryShows(rows: readonly LibraryShowRow[], { by, how }: LibrarySort): LibraryShowRow[] {
  const flip = how === 'desc' ? -1 : 1;
  return rows.toSorted((a, b) => flip * compare(KEYS[by](a), KEYS[by](b)) || compare(title(a), title(b)));
}
