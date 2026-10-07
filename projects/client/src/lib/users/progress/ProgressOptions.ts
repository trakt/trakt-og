/**
 * The viewer's watched progress settings og applies itself, to the season lists: specials, and which square is up
 * next. The rows are the shows `/sync/progress/up_next_nitro` returns, so Include Watchlisted and Include Library no
 * longer add shows to them.
 */
export type ProgressOptions = {
  readonly includeSpecials: boolean;
  readonly useLastActivity: boolean;
};
