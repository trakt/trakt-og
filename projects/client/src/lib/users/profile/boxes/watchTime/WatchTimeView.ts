/** One bar of a Watch Time chart. */
type WatchBar = {
  /** Of the busiest bar, 0 to 100. */
  readonly height: number;
  readonly peak: boolean;
  /** The tooltip, in bold: "Sep 6" or "2019"... */
  readonly title: string;
  /** ...over its plays, "3 plays"... */
  readonly plays: string;
  /** ...and its time watched: "2h 10m", or "~38d 4h" all time, from the average play's length. */
  readonly time: string;
};

/** A bar chart and its summary for screen readers. */
export type WatchChart = { readonly bars: readonly WatchBar[]; readonly label: string };

export type WatchTimeView = {
  /** The tab it opens on: the last 30 days for a member who joined within them, all time otherwise. */
  readonly opens: 'all' | 'month';
  /** The last 30 days: hours ("41h", or "2.7h" under ten), plays, the days with any, and a bar a day. */
  readonly month: {
    readonly hours: string;
    readonly episodes: number;
    readonly movies: number;
    readonly activeDays: number;
    readonly chart: WatchChart;
  };
  /**
   * "104d 7h" or "1y 290d 6h", with the shows, episodes and movies watched, and plays a week, month, quarter or year
   * since they joined; `null` when the history didn't load.
   */
  readonly allTime: {
    readonly time: string;
    readonly shows: number;
    readonly episodes: number;
    readonly movies: number;
    readonly chart: WatchChart | null;
  };
};
