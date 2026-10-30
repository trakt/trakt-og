import { playRuntime } from '../playRuntime.ts';
import type { HistoryRow, WatchedMovieRow, WatchedShowRow } from './historyRowsSchema.ts';
import type { HistorySort, HistorySortBy } from './historySort.ts';

type Counted = { readonly plays: number; readonly minutes: number; readonly last_watched_at: string };
export type ShowChart = Counted & Pick<WatchedShowRow, 'show'>;
export type MovieChart = Counted & Pick<WatchedMovieRow, 'movie'>;

/** OG's "charts mode": one row a show or movie, with its plays and time spent. */
export type ChartRow = ShowChart | MovieChart;

export const isShowChart = (row: ChartRow): row is ShowChart => 'show' in row;

/**
 * A watched list row with its time spent. The list has no runtime a play, so a show's is its plays at the show's
 * runtime, close to OG's sum of each episode's.
 */
export function fromWatched(row: WatchedShowRow | WatchedMovieRow): ChartRow {
  const runtime = 'movie' in row ? playRuntime(row) : playRuntime({ show: row.show, episode: {} });
  return { ...row, minutes: row.plays * runtime };
}

/** Plays grouped by show or movie, at each one's newest play, in the order they came (newest first). */
export function toChartsFromPlays(rows: readonly HistoryRow[]): ChartRow[] {
  const seen = new Map<string, ChartRow>();
  for (const row of rows) {
    const key = 'movie' in row ? `movie-${row.movie.ids.trakt}` : `show-${row.show.ids.trakt}`;
    const minutes = playRuntime(row);
    const found = seen.get(key);
    if (found) {
      seen.set(key, { ...found, plays: found.plays + 1, minutes: found.minutes + minutes });
      continue;
    }
    const counted = { plays: 1, minutes, last_watched_at: row.watched_at };
    seen.set(key, 'movie' in row ? { ...counted, movie: row.movie } : { ...counted, show: row.show });
  }
  return [...seen.values()];
}

const media = (row: ChartRow) => ('movie' in row ? row.movie : row.show);
const time = (date: string | null | undefined) => (date ? Date.parse(date) || 0 : 0);
const title = (row: ChartRow) =>
  media(row)
    .title.toLowerCase()
    .replace(/^(the |an |a )/, '');
const released = (row: ChartRow) => time('movie' in row ? row.movie.released : row.show.first_aired);

type Key = readonly [(row: ChartRow) => number | string, 1 | -1];

// OG's ORDER BY for each sort's own direction, tie breaks included: Percentage and Votes break ties on fewer plays.
const KEYS: Record<HistorySortBy, readonly Key[]> = {
  added: [
    [(row) => time(row.last_watched_at), -1],
    [(row) => row.plays, -1],
  ],
  plays: [
    [(row) => row.plays, -1],
    [(row) => time(row.last_watched_at), -1],
  ],
  time: [
    [(row) => row.minutes, -1],
    [(row) => row.plays, -1],
  ],
  title: [[title, 1]],
  released: [
    [released, -1],
    [title, -1],
  ],
  runtime: [[(row) => media(row).runtime ?? 0, -1]],
  percentage: [
    [(row) => media(row).rating ?? 0, -1],
    [(row) => row.plays, 1],
  ],
  votes: [
    [(row) => media(row).votes ?? 0, -1],
    [(row) => row.plays, 1],
  ],
};

const compare = (a: number | string, b: number | string) =>
  typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b, 'en') : Number(a) - Number(b);

/** The rows in OG's order for `sort`, `desc` flipping every key. Never mutates the rows. */
export function sortCharts(rows: readonly ChartRow[], { by, how }: HistorySort): ChartRow[] {
  const flip = how === 'desc' ? -1 : 1;
  return rows.toSorted((a, b) => {
    for (const [key, direction] of KEYS[by]) {
      const compared = compare(key(a), key(b));
      if (compared) return flip * direction * compared;
    }
    return 0;
  });
}
