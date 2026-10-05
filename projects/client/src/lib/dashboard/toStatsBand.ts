import type { UserStats } from '../stats/userStatsSchema.ts';
import { type RatingBar, toRatingsChart } from '../users/profile/toRatingsChart.ts';
import { formatRuntime } from '../utils/formatRuntime.ts';
import { readableStat } from '../utils/readableStat.ts';

/** A count as shown, plus its exact value when the shown one is rounded. */
export type StatFigure = { readonly text: string; readonly exact: string | null };

export type StatsBand = {
  /** Total time in its largest readable unit: "4.6" years, or days, or hours. `exact` is "1668d 4h 52m". */
  readonly time: { readonly value: string; readonly unit: string; readonly exact: string };
  readonly plays: StatFigure;
  readonly days: StatFigure;
  /** Null when the stats came without `progress`. */
  readonly shows: {
    readonly finished: StatFigure;
    readonly watched: StatFigure;
    readonly started: StatFigure;
    readonly dropped: StatFigure;
    /** Finished, in progress and dropped as shares of the three, 0 to 100. Null when there are none. */
    readonly meter: { readonly finished: number; readonly started: number; readonly dropped: number } | null;
  } | null;
  readonly ratings: {
    readonly total: StatFigure;
    /** "8.2", null with no ratings. */
    readonly average: string | null;
    /** Ratings 1 to 10, empty with no ratings. */
    readonly bars: readonly RatingBar[];
    /** Where the average sits along the bars, 0 to 100. */
    readonly tick: number;
  };
  /** The overlay's counts. Null until it resolves: /users/:id/stats reports zero for everyone. */
  readonly library: { readonly movies: StatFigure; readonly episodes: StatFigure; readonly shows: StatFigure } | null;
  readonly comments: {
    readonly total: StatFigure;
    readonly movies: StatFigure;
    readonly shows: StatFigure;
    /** Null when the stats came without `lists`. */
    readonly lists: StatFigure | null;
  };
  readonly followers: StatFigure;
  readonly friends: StatFigure;
};

type Library = { episodes: number | undefined; shows: number | undefined; movies: number | undefined };

const ROUND_FROM = 10_000;
const MINUTES_PER_DAY = 1440;

/** "26.6k" with the exact "26,647" from 10,000 up; smaller counts show exactly. */
const figure = (n: number): StatFigure => {
  const exact = n.toLocaleString('en-US');
  return n >= ROUND_FROM ? { text: readableStat(n), exact } : { text: exact, exact: null };
};

function readableTime(minutes: number) {
  const days = minutes / MINUTES_PER_DAY;
  const [value, unit] = days >= 365
    ? [(days / 365).toFixed(1), 'year']
    : days >= 1
    ? [String(Math.round(days)), 'day']
    : [String(Math.round(minutes / 60)), 'hour'];
  return { value, unit: value === '1' ? unit : `${unit}s`, exact: formatRuntime(minutes) };
}

const share = (part: number, whole: number) => (part / whole) * 100;

type Progress = NonNullable<UserStats['progress']>;

function meter({ finished, started, dropped }: Progress) {
  const total = finished + started + dropped;
  if (total === 0) return null;
  return { finished: share(finished, total), started: share(started, total), dropped: share(dropped, total) };
}

function ratings(distribution: UserStats['ratings']['distribution'], total: number) {
  const chart = toRatingsChart(distribution);
  const average = chart.bars.length > 0 ? Number(chart.average) : null;
  return {
    total: figure(total),
    average: average === null ? null : average.toFixed(1),
    bars: chart.bars,
    // Bar n's middle sits at (n - 0.5) tenths of the way along.
    tick: average === null ? 0 : share(average - 0.5, 10),
  };
}

function library({ episodes, shows, movies }: Library) {
  if (episodes === undefined || shows === undefined || movies === undefined) return null;
  return { movies: figure(movies), episodes: figure(episodes), shows: figure(shows) };
}

/** The dashboard greeting's all-time band: `/users/me/stats`, plus the overlay's library counts once they load. */
const shows = (progress: Progress, watched: number) => ({
  finished: figure(progress.finished),
  watched: figure(watched),
  started: figure(progress.started),
  dropped: figure(progress.dropped),
  meter: meter(progress),
});

export function toStatsBand(stats: UserStats, collected: Library): StatsBand {
  const { progress, movies, seasons, episodes } = stats;
  return {
    time: readableTime(stats.total_minutes),
    plays: figure(stats.total_plays),
    days: figure(Math.floor(stats.total_minutes / MINUTES_PER_DAY)),
    shows: progress ? shows(progress, stats.shows.watched) : null,
    ratings: ratings(stats.ratings.distribution, stats.ratings.total),
    library: library(collected),
    comments: {
      total: figure(movies.comments + stats.shows.comments + seasons.comments + episodes.comments),
      movies: figure(movies.comments),
      shows: figure(stats.shows.comments),
      lists: stats.lists === null ? null : figure(stats.lists),
    },
    followers: figure(stats.network.followers),
    friends: figure(stats.network.friends),
  };
}
