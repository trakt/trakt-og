import type { GenreBar } from '../users/profile/toGenreBar.ts';

type PlayType = 'episode' | 'movie';

/** One genre-style key over the chart: "EPISODES", "9", "3h 26m · 2 shows". */
type WatchedKey = {
  readonly name: string;
  readonly share: string;
  readonly counts: readonly string[];
  /** Colors its rule like that type's bars; neutral without one. */
  readonly type?: PlayType;
};

/** A tooltip line, dashed in its type's color: "3 episodes (4 plays) · 1h 7m". */
type MinutesLine = { readonly type: PlayType; readonly text: string };

/** A labelled line across the plot, "2h", at a height from 0 to 100. */
type MinutesLevel = { readonly label: string; readonly height: number };

/** One bar of the minutes-per-day chart. */
export type MinutesDay = {
  /** `YYYY-MM-DD` in the viewer's zone. */
  readonly date: string;
  readonly minutes: number;
  /** The episodes' and the movies' parts of the bar, stacked in that order, each 0 to 100 of the plot. */
  readonly episodes: number;
  readonly movies: number;
  /** "2h 1m", the tooltip's big number. */
  readonly time: string;
  /** "Tuesday — Sep 29". */
  readonly label: string;
  readonly lines: readonly MinutesLine[];
  /** Under the bar: "Sep 6" on the first day and the 1st, "Today" on the last, otherwise the day of the month. */
  readonly axis: string;
  readonly mark: 'month' | 'today' | 'weekend' | null;
  /** The viewer's history for that day. */
  readonly href: string;
};

/** A bracket over a week's bars, with its total. Weeks start on the viewer's first day of the week. */
type MinutesWeek = {
  /** How many of the 30 days it covers. */
  readonly span: number;
  /** "5h 11m", empty for a week with nothing watched. */
  readonly time: string;
  readonly best: boolean;
};

export type MinutesChartData = {
  /** Today and the 29 days before it, oldest first. */
  readonly days: readonly MinutesDay[];
  readonly weeks: readonly MinutesWeek[];
  /** The hour lines, "1h" up to the top of the scale. */
  readonly hours: readonly MinutesLevel[];
  /** The average day with something watched: "1h 36m average day". */
  readonly average: MinutesLevel;
};

/** The dashboard's Last 30 Days panel. */
export type LastThirtyDays = {
  /** Null when nothing was watched: OG hid the chart. */
  readonly chart: MinutesChartData | null;
  /** Time watched, episodes, movies and the best week over the chart; empty without one. */
  readonly keys: readonly WatchedKey[];
  readonly genres: readonly GenreBar[];
};
