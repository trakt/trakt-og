/**
 * The viewer's watched progress settings og applies itself, to the season lists: specials, and which square is up
 * next. The rows are the shows `/sync/progress/up_next_nitro` returns, so Include Library no longer adds shows to them,
 * and Include Watchlisted only keeps or drops the watchlisted shows it returns (`filterProgress`).
 */
export type ProgressOptions = {
  readonly includeSpecials: boolean;
  readonly useLastActivity: boolean;
};
