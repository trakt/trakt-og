export type RatingsView = {
  /** "2,310 rated". */
  readonly total: string;
  /** "7.4". */
  readonly average: string;
  /** One bar per score from 1 to 10, as a share of the most used one. */
  readonly bars: readonly { readonly height: number; readonly mode: boolean; readonly title: string }[];
  /** The chart's summary for screen readers. */
  readonly chartLabel: string;
  readonly latestTen: { readonly text: string; readonly href: string } | null;
  /** "140 comments". */
  readonly comments: string;
};
