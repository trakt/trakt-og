export type RecapTally = {
  readonly plays: number;
  /** The distinct shows or movies; null past the page cap, where only the plays are counted. */
  readonly titles: number | null;
};

/** A month's (or the year's) plays, split into episodes and movies, for the recap strip's hover card. */
export type RecapSplit = {
  readonly episodes: RecapTally;
  readonly movies: RecapTally;
};

/** Where a hover card's split stands: it loads on the first hover, and a failed one loads again on the next. */
export type RecapSplitState =
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly split: RecapSplit }
  | { readonly status: 'failed' };
