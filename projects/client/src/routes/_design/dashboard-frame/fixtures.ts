import type { UserStatsResponse } from '@trakt/api';
import { FIRST_NIGHT_GOAL } from '../../../lib/firstNight/firstNight.ts';
import { toProfileUser } from '../../../lib/users/toProfileUser.ts';

const quiet = {
  seasons: { ratings: 0, comments: 0 },
  network: { friends: 0, followers: 0, following: 2 },
  ratings: { total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 } },
  lists: 0,
};

/** Joined this month, not a VIP. */
export const newMember = toProfileUser({
  username: 'reel_rookie',
  name: 'Sam Rivera',
  private: false,
  vip: false,
  ids: { slug: 'reel_rookie' },
});

/** Six shows and four movies: the goal, so the greeting takes over from the welcome wall. */
export const pastTheWall = {
  ...quiet,
  movies: { plays: 4, watched: 4, minutes: 494, collected: 0, ratings: 3, comments: 0 },
  shows: { watched: FIRST_NIGHT_GOAL - 4, collected: 0, ratings: 2, comments: 0 },
  episodes: { plays: 31, watched: 31, minutes: 1452, collected: 0, ratings: 0, comments: 0 },
  progress: { finished: 1, started: 5, dropped: 0 },
  total_minutes: 1946,
  total_plays: 35,
} satisfies UserStatsResponse;

/** Skipped the welcome wall before watching anything. */
export const nothingWatched = {
  ...quiet,
  movies: { plays: 0, watched: 0, minutes: 0, collected: 0, ratings: 0, comments: 0 },
  shows: { watched: 0, collected: 0, ratings: 0, comments: 0 },
  episodes: { plays: 0, watched: 0, minutes: 0, collected: 0, ratings: 0, comments: 0 },
  progress: { finished: 0, started: 0, dropped: 0 },
  total_minutes: 0,
  total_plays: 0,
} satisfies UserStatsResponse;
