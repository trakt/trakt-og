import type { UserStats } from '../../stats/userStatsSchema.ts';

/** Whether the user has any activity. Without any, the strip hides: your own profile shows the welcome hero. */
export const hasActivity = (stats: UserStats) =>
  [stats.episodes.minutes, stats.movies.minutes, stats.episodes.collected, stats.movies.collected].some((n) => n > 0);
