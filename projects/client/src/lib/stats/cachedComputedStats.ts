import { cachedOnActivity } from '../activity/cachedOnActivity.ts';
import type { ReadLastActivities } from '../activity/createLastActivities.ts';
import type { StatsCounts } from './StatsCounts.ts';
import type { UserStats } from './userStatsSchema.ts';

// Newly aired episodes move a finished show back to in progress without any activity of yours.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type Params = {
  /** The shared `last_activities` reader. */
  activities: ReadLastActivities;
  user: string;
  counts: StatsCounts;
  /** The full count, run when nothing saved still matches. */
  read: () => Promise<UserStats>;
  /** Given, saved stats come back at once and a recount arrives here if your activity moved. */
  onUpdate?: (stats: UserStats) => void;
} & Pick<Parameters<typeof cachedOnActivity>[0], 'storage' | 'now'>;

/**
 * og's own stats for you, kept between visits until something that moves them changes: a play, a hidden or dropped
 * show, or any of the counts. Reused for up to a day.
 */
export function cachedComputedStats({ counts, ...params }: Params): Promise<UserStats> {
  return cachedOnActivity({
    ...params,
    name: 'stats',
    maxAgeMs: MAX_AGE_MS,
    key: ({ movies, episodes, shows }) => [
      counts,
      movies?.watched_at,
      episodes?.watched_at,
      shows?.hidden_at,
      shows?.dropped_at,
    ],
  });
}
