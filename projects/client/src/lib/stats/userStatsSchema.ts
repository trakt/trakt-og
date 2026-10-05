import type { UserStatsResponse } from '@trakt/api';
import { z } from 'zod/v4';

const count = z.number().int();
const watched = { plays: count, watched: count, minutes: count, collected: count, ratings: count, comments: count };

/** `/users/:id/stats` as og reads it. `progress` and `lists` are null when the API didn't send them. */
export type UserStats = Omit<UserStatsResponse, 'progress' | 'lists'> & {
  readonly progress: UserStatsResponse['progress'] | null;
  readonly lists: number | null;
};

/**
 * `/users/:id/stats`. An account the API hasn't summed up yet gets an older body: no `progress`, `lists` or totals,
 * and possibly an empty `distribution`. Totals are added up from the per-type counts, missing scores count as zero,
 * and `progress` and `lists` come back null.
 */
export const userStatsSchema = z.object({
  movies: z.object(watched),
  shows: z.object({ watched: count, collected: count, ratings: count, comments: count }),
  seasons: z.object({ ratings: count, comments: count }),
  episodes: z.object(watched),
  network: z.object({ friends: count, followers: count, following: count }),
  ratings: z.object({ total: count, distribution: z.record(z.string(), z.number()) }),
  progress: z.object({ started: count, finished: count, dropped: count }).nullish(),
  lists: count.nullish(),
  total_minutes: count.nullish(),
  total_plays: count.nullish(),
}).transform(({ ratings, progress, lists, total_minutes, total_plays, ...stats }): UserStats => {
  const score = (n: number) => ratings.distribution[n] ?? 0;
  return {
    ...stats,
    ratings: {
      total: ratings.total,
      distribution: {
        1: score(1),
        2: score(2),
        3: score(3),
        4: score(4),
        5: score(5),
        6: score(6),
        7: score(7),
        8: score(8),
        9: score(9),
        10: score(10),
      },
    },
    progress: progress ?? null,
    lists: lists ?? null,
    total_minutes: total_minutes ?? stats.episodes.minutes + stats.movies.minutes,
    total_plays: total_plays ?? stats.episodes.plays + stats.movies.plays,
  };
});
