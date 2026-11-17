import type { LastActivitiesResponse } from '@trakt/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cachedComputedStats } from './cachedComputedStats.ts';
import { activityCacheStorage } from '../activity/activityCacheStorage.ts';
import type { StatsCounts } from './StatsCounts.ts';
import type { UserStats } from './userStatsSchema.ts';

const counts: StatsCounts = {
  watched: { movies: 2, shows: 1, episodes: 5 },
  plays: { movies: 3, episodes: 6 },
  ratings: {
    movies: 0,
    shows: 0,
    seasons: 0,
    episodes: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  },
  comments: { movies: 0, shows: 0, seasons: 0, episodes: 0 },
  lists: 0,
};
const stats = { total_plays: 9 } as UserStats;

let activities: LastActivitiesResponse | null = null;
const activity = (watchedAt: string, droppedAt = '2026-01-01T00:00:00.000Z') =>
  ({
    movies: { watched_at: watchedAt },
    episodes: { watched_at: watchedAt },
    shows: { hidden_at: '2026-01-01T00:00:00.000Z', dropped_at: droppedAt },
  }) as LastActivitiesResponse;

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
};

describe('cachedComputedStats', () => {
  let local: ReturnType<typeof memory>;
  let read: ReturnType<typeof vi.fn<() => Promise<UserStats>>>;
  let time: number;
  const run = (params: Partial<Parameters<typeof cachedComputedStats>[0]> = {}) =>
    cachedComputedStats({
      activities: () => Promise.resolve(activities),
      user: 'sean',
      counts,
      read,
      storage: activityCacheStorage(local),
      now: () => time,
      ...params,
    });

  beforeEach(() => {
    local = memory();
    read = vi.fn(() => Promise.resolve(stats));
    time = Date.parse('2026-11-17T12:00:00Z');
    activities = activity('2026-11-17T10:00:00.000Z');
  });

  it('should count once, then reuse the saved stats while nothing moved', async () => {
    await run();
    const again = await run();

    expect(again).toEqual(stats);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('should count again after a new play', async () => {
    await run();
    activities = activity('2026-11-17T11:00:00.000Z');
    await run();

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('should count again after a show is dropped', async () => {
    await run();
    activities = activity('2026-11-17T10:00:00.000Z', '2026-11-17T11:30:00.000Z');
    await run();

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('should count again when the counts changed', async () => {
    await run();
    await run({ counts: { ...counts, ratings: { ...counts.ratings, movies: 1 } } });

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('should count again after a day, for newly aired episodes', async () => {
    await run();
    time += 25 * 60 * 60 * 1000;
    await run();

    expect(read).toHaveBeenCalledTimes(2);
  });
});
