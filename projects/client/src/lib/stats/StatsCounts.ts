import type { UserStats } from './userStatsSchema.ts';

type PerType = { readonly movies: number; readonly shows: number; readonly seasons: number; readonly episodes: number };

/** A user's counts, each a list's `X-Pagination-Item-Count`: what og reads in place of `/users/:id/stats`. */
export type StatsCounts = {
  /** Unique movies, shows and episodes watched. */
  readonly watched: { readonly movies: number; readonly shows: number; readonly episodes: number };
  readonly ratings: PerType & { readonly distribution: UserStats['ratings']['distribution'] };
  readonly comments: PerType;
  readonly lists: number;
};
