import type { LastActivitiesResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { toDashboardSettings } from './toDashboardSettings.ts';
import { dailyKey, recentlyWatchedKey, upNextKey, watchlistKey } from './panelCacheKeys.ts';

const preferences = { order: 'mdy', timeZone: 'America/Los_Angeles', hour24: false, weekStartDay: 0 } as const;
const activity = (overrides: Record<string, Record<string, string>> = {}) =>
  ({
    movies: { watched_at: 'm1', rated_at: 'r1' },
    episodes: { watched_at: 'e1' },
    shows: { hidden_at: 'h1', dropped_at: 'd1' },
    watchlist: { updated_at: 'w1' },
    ...overrides,
  }) as unknown as LastActivitiesResponse;
const same = (a: unknown, b: unknown) => expect(JSON.stringify(a)).toBe(JSON.stringify(b));
const differs = (a: unknown, b: unknown) => expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
const upNext = toDashboardSettings({ settings: null }).upNext;

describe('panelCacheKeys', () => {
  describe('upNextKey', () => {
    it('should reuse the saved read while nothing it depends on moved', () => {
      same(
        upNextKey(activity(), upNext),
        upNextKey(activity({ movies: { watched_at: 'm1', rated_at: 'r2' } }), upNext),
      );
    });

    it.each([
      ['a movie play', { movies: { watched_at: 'm2' } }],
      ['an episode play', { episodes: { watched_at: 'e2' } }],
      ['a hidden show', { shows: { hidden_at: 'h2', dropped_at: 'd1' } }],
      ['a dropped show', { shows: { hidden_at: 'h1', dropped_at: 'd2' } }],
    ])('should read again after %s', (_, moved) => {
      differs(upNextKey(activity(), upNext), upNextKey(activity(moved), upNext));
    });

    it('should read again when the sort changes', () => {
      const sorted = { ...upNext, sort: { by: 'title', how: 'desc', title: 'Title' } } as typeof upNext;
      differs(upNextKey(activity(), upNext), upNextKey(activity(), sorted));
    });
  });

  describe('recentlyWatchedKey', () => {
    it('should read again when a play lands or the date format changes', () => {
      differs(
        recentlyWatchedKey(activity(), preferences),
        recentlyWatchedKey(activity({ episodes: { watched_at: 'e2' } }), preferences),
      );
      differs(
        recentlyWatchedKey(activity(), preferences),
        recentlyWatchedKey(activity(), { ...preferences, hour24: true }),
      );
    });

    it('should ignore the watchlist', () => {
      same(
        recentlyWatchedKey(activity(), preferences),
        recentlyWatchedKey(activity({ watchlist: { updated_at: 'w2' } }), preferences),
      );
    });
  });

  describe('dailyKey', () => {
    it('should reuse the saved read within the same day in the viewer zone', () => {
      same(
        dailyKey(activity(), preferences, new Date('2026-09-30T08:00:00Z')),
        dailyKey(activity(), preferences, new Date('2026-09-30T20:00:00Z')),
      );
    });

    it('should read again when the day rolls over in the viewer zone, not in UTC', () => {
      differs(
        dailyKey(activity(), preferences, new Date('2026-09-30T06:00:00Z')),
        dailyKey(activity(), preferences, new Date('2026-09-30T08:00:00Z')),
      );
    });

    it('should read again after a play', () => {
      const now = new Date('2026-09-30T12:00:00Z');
      differs(
        dailyKey(activity(), preferences, now),
        dailyKey(activity({ movies: { watched_at: 'm2' } }), preferences, now),
      );
    });
  });

  describe('watchlistKey', () => {
    it('should read again only when the watchlist moves', () => {
      same(
        watchlistKey(activity(), preferences),
        watchlistKey(activity({ episodes: { watched_at: 'e2' } }), preferences),
      );
      differs(
        watchlistKey(activity(), preferences),
        watchlistKey(activity({ watchlist: { updated_at: 'w2' } }), preferences),
      );
    });
  });
});
