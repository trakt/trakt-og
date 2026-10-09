import type { RatingTarget } from '../rating/RatingTarget.ts';

/** Seasons carry their parent since progress and the overlay key them by show and season number. */
export type WatchTarget = RatingTarget & {
  season?: { show: number; number: number; episode?: number };
  airedEpisodes?: number;
  runtime?: number;
  /** Aired episode ids in broadcast order, when the page already has them. */
  episodeIds?: readonly number[];
  /** False before it's out: it can't be watched or checked into. Left out when the page doesn't know. */
  released?: boolean;
  /**
   * A season target that acts on just these episodes, adding and removing: a calendar card that groups one show's
   * episodes from the same day.
   */
  onlyEpisodeIds?: readonly number[];
};
