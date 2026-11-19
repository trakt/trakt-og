export type RatingsView = {
  /** The label: "2,310 Ratings". */
  readonly total: string;
  /** "7.4". */
  readonly average: string;
  /** Where the average falls across the bars, 0 to 100, for its dotted line. */
  readonly averageAt: number;
  /** One bar per score from 1 to 10, as a share of the most used one. */
  /**
   * `tip` is the bar's tooltip, its count over the profile chart's share in gray ("123", "ratings", "24% of all
   * ratings"), and `null` for a score with none.
   */
  readonly bars: readonly {
    readonly height: number;
    readonly mode: boolean;
    readonly tip: { readonly count: string; readonly noun: string; readonly share: string } | null;
  }[];
  /** The chart's summary for screen readers. */
  readonly chartLabel: string;
  readonly latestTen: { readonly text: string; readonly href: string } | null;
};
