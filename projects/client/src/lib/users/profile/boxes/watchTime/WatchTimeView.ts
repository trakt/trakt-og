export type WatchTimeView = {
  /** Hours in the last 30 days: "41h", or "2.7h" under ten. */
  readonly hours: string;
  /** "131 eps · 1 movie · 25 active days". */
  readonly summary: string;
  /** One bar per UTC day, oldest first, ending today. */
  readonly days: readonly {
    /** Of the busiest day, 0 to 100. */
    readonly height: number;
    readonly peak: boolean;
    /** "Sep 6: 2h 10m". */
    readonly title: string;
  }[];
  /** The chart's summary for screen readers. */
  readonly chartLabel: string;
  readonly allTime: { readonly time: string; readonly episodes: string; readonly movies: string };
};
