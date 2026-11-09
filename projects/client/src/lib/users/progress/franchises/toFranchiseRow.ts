import { progressPercent } from '../../../components/media/progressPercent.ts';
import { tickRuns } from '../../../components/media/tickRuns.ts';
import type { DatePreferences } from '../../../settings/DatePreferences.ts';
import { formatDate } from '../../../utils/formatDate.ts';
import { formatRuntime } from '../../../utils/formatRuntime.ts';
import { isUnknownDate } from '../../../utils/isUnknownDate.ts';
import { relativeDate } from '../../../utils/relativeDate.ts';
import type { Franchise } from './Franchise.ts';
import type { FranchiseMovie } from './FranchiseMovie.ts';
import { pickFranchiseFeature } from './pickFranchiseFeature.ts';
import { franchiseHref } from './franchiseHref.ts';
import type { FranchiseRow } from './FranchiseRow.ts';

type ToFranchiseRowParams = {
  franchise: Pick<Franchise, 'id' | 'slug' | 'name'>;
  /** In release order. */
  movies: readonly FranchiseMovie[];
  /** Movie id to its watch dates. */
  plays: ReadonlyMap<number, readonly string[]>;
  datePreferences: DatePreferences;
  now: Date;
};

const years = (movies: readonly FranchiseMovie[]) => {
  const [first, last] = [movies.at(0)?.released, movies.at(-1)?.released].map((date) => date?.slice(0, 4));
  if (!first || !last) return undefined;
  return first === last ? first : `${first}-${last}`;
};

const newest = (dates: readonly string[]) => dates.toSorted((a, b) => Date.parse(b) - Date.parse(a)).at(0);

/**
 * A franchise's row. A movie not yet released shows in the strip but isn't counted: not in the bar, the percent or
 * what's left, like an episode that hasn't aired.
 */
export function toFranchiseRow({ franchise, movies, plays, datePreferences, now }: ToFranchiseRowParams): FranchiseRow {
  const playsOf = (movie: FranchiseMovie) => plays.get(movie.id) ?? [];
  const isWatched = (movie: FranchiseMovie) => playsOf(movie).length > 0;
  const released = movies.filter(({ released: date }) => Date.parse(date) <= now.getTime());
  const unwatched = released.filter((movie) => !isWatched(movie));
  const watched = released.length - unwatched.length;
  const rowMovies = movies.map((movie) => ({
    ...movie,
    watched: isWatched(movie),
    released: released.includes(movie),
    releaseDate: movie.released,
  }));
  const last = movies
    .flatMap((movie) => {
      const at = newest(playsOf(movie));
      return at ? [{ movie, at }] : [];
    })
    .toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .at(0);

  const watchedMinutes = movies.reduce((sum, movie) => sum + movie.runtime * playsOf(movie).length, 0);

  return {
    id: franchise.id,
    title: franchise.name,
    href: franchiseHref(franchise),
    poster: released.at(0)?.poster,
    years: years(movies),
    percent: progressPercent({ aired: released.length, completed: watched }),
    ticks: tickRuns(released.map(isWatched)),
    watched,
    released: released.length,
    left: unwatched.length,
    plays: movies.reduce((sum, movie) => sum + playsOf(movie).length, 0),
    watchedMinutes,
    watchedTime: formatRuntime(watchedMinutes),
    leftTime: formatRuntime(unwatched.reduce((sum, { runtime }) => sum + runtime, 0)),
    last: last && {
      title: last.movie.title,
      href: last.movie.href,
      relative: isUnknownDate(last.at) ? undefined : relativeDate(last.at, now),
      date: isUnknownDate(last.at) ? 'Unknown date' : formatDate(last.at, { ...datePreferences, time: true }),
    },
    feature: pickFranchiseFeature(rowMovies),
    movies: rowMovies,
  };
}
