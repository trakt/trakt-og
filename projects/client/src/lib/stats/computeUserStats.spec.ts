import { describe, expect, it } from 'vitest';
import type { WatchedItemRow } from '../users/profile/watchedItemsSchema.ts';
import { computeUserStats } from './computeUserStats.ts';
import type { StatsCounts } from './StatsCounts.ts';

const counts: StatsCounts = {
  watched: { movies: 2, shows: 3, episodes: 7 },
  ratings: {
    movies: 2,
    shows: 1,
    seasons: 0,
    episodes: 1,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 2, 9: 0, 10: 1 },
  },
  comments: { movies: 1, shows: 0, seasons: 2, episodes: 3 },
  lists: 4,
};

const media = (id: number, extra: object = {}) => ({ ids: { trakt: id, slug: `t-${id}` }, title: `T${id}`, ...extra });
const movie = (id: number, plays: number, runtime: number | null): WatchedItemRow => ({
  plays,
  last_watched_at: '2026-10-01T00:00:00Z',
  movie: media(id, { runtime }),
});
const episodes = (count: number) => Array.from({ length: count }, (_, i) => ({ number: i + 1, plays: 1 }));
type ShowOptions = { aired?: number; watched?: number; plays?: number; reset?: boolean; specials?: number };
const show = (
  id: number,
  { aired = 2, watched = 2, plays = watched, reset = false, specials = 0 }: ShowOptions = {},
): WatchedItemRow => ({
  plays,
  last_watched_at: '2026-10-01T00:00:00Z',
  reset_at: reset ? '2026-09-01T00:00:00Z' : null,
  show: media(id, { runtime: 30, aired_episodes: aired }),
  seasons: [
    { number: 0, episodes: episodes(specials) },
    { number: 1, episodes: episodes(watched) },
  ],
});

const lists = {
  movies: [movie(1, 2, 100), movie(2, 1, null)],
  shows: [show(10), show(11, { aired: 5, watched: 2, specials: 3 }), show(12, { reset: true, plays: 4 })],
};

describe('computeUserStats', () => {
  it('should take the counts as they came', () => {
    const stats = computeUserStats({ counts, watched: lists, dropped: null });

    expect(stats.movies).toMatchObject({ watched: 2, ratings: 2, comments: 1, collected: 0 });
    expect(stats.shows).toMatchObject({ watched: 3, ratings: 1, comments: 0 });
    expect(stats.seasons).toEqual({ ratings: 0, comments: 2 });
    expect(stats.episodes).toMatchObject({ watched: 7, ratings: 1, comments: 3 });
    expect(stats.ratings.total).toBe(4);
    expect(stats.lists).toBe(4);
    expect(stats.network).toBeNull();
  });

  it('should count plays and minutes from the watched lists, a missing runtime as none', () => {
    const stats = computeUserStats({ counts, watched: lists, dropped: null });

    expect(stats.movies).toMatchObject({ plays: 3, minutes: 200 });
    expect(stats.episodes).toMatchObject({ plays: 8, minutes: 240 });
    expect([stats.total_plays, stats.total_minutes]).toEqual([11, 440]);
  });

  it('should leave progress out when the dropped shows are unknown', () => {
    expect(computeUserStats({ counts, watched: lists, dropped: null }).progress).toBeNull();
  });

  it('should leave progress out when the shows came without their episodes', () => {
    const shows = lists.shows.map((row) => ({ ...row, seasons: undefined }));

    expect(computeUserStats({ counts, watched: { ...lists, shows }, dropped: new Set() }).progress).toBeNull();
  });

  describe('for progress', () => {
    it('should finish a show with every aired episode watched, without specials or a rewatch', () => {
      const progress = computeUserStats({ counts, watched: lists, dropped: new Set() }).progress;

      expect(progress).toEqual({ finished: 1, started: 2, dropped: 0 });
    });

    it('should count dropped shows apart from started ones', () => {
      const progress = computeUserStats({ counts, watched: lists, dropped: new Set([11, 99]) }).progress;

      expect(progress).toEqual({ finished: 1, started: 1, dropped: 2 });
    });
  });
});
