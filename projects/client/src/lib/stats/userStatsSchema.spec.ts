import { describe, expect, it } from 'vitest';
import { userStatsSchema } from './userStatsSchema.ts';

/** The older body: per-type counts, network and ratings, nothing else. */
const olderStatsBody = {
  movies: { plays: 13, watched: 7, minutes: 1971, collected: 6, ratings: 0, comments: 0 },
  shows: { watched: 5, collected: 2, ratings: 0, comments: 0 },
  seasons: { ratings: 0, comments: 0 },
  episodes: { plays: 50, watched: 50, minutes: 3000, collected: 10, ratings: 0, comments: 0 },
  network: { friends: 0, followers: 1, following: 2 },
  ratings: { total: 0, distribution: {} },
};

describe('schema: userStatsSchema', () => {
  it('should add up the totals and null progress and lists when the body has none', () => {
    const stats = userStatsSchema.parse(olderStatsBody);

    expect(stats.total_minutes).toBe(4971);
    expect(stats.total_plays).toBe(63);
    expect(stats.progress).toBeNull();
    expect(stats.lists).toBeNull();
  });

  it('should count missing scores as zero', () => {
    const stats = userStatsSchema.parse({ ...olderStatsBody, ratings: { total: 2, distribution: { '8': 2 } } });

    expect(stats.ratings.distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 2, 9: 0, 10: 0 });
  });

  it('should keep the totals, progress and lists it was sent', () => {
    const stats = userStatsSchema.parse({
      ...olderStatsBody,
      progress: { started: 3, finished: 2, dropped: 0 },
      lists: 4,
      total_minutes: 5000,
      total_plays: 70,
    });

    expect([stats.total_minutes, stats.total_plays, stats.lists]).toEqual([5000, 70, 4]);
    expect(stats.progress).toEqual({ started: 3, finished: 2, dropped: 0 });
  });

  it('should refuse a body without the per-type counts', () => {
    expect(userStatsSchema.safeParse({ network: olderStatsBody.network }).success).toBe(false);
  });
});
