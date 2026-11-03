import { describe, expect, it } from 'vitest';
import { isNewAccount, trackedTitles } from './firstNight.ts';

describe('isNewAccount', () => {
  it('should count an account with fewer than ten titles watched as new', () => {
    expect(isNewAccount(9)).toBe(true);
  });

  it('should not count an account with ten or more', () => {
    expect(isNewAccount(10)).toBe(false);
  });
});

describe('trackedTitles', () => {
  it('should wait until both watched slices have loaded', () => {
    expect(trackedTitles({})).toBeNull();
    expect(trackedTitles({ watchedMovies: new Map() })).toBeNull();
  });

  it('should count each title once across watched, watchlist, ratings and favorites', () => {
    expect(
      trackedTitles({
        watchedMovies: new Map([[1, ['2026-10-01']]]),
        watchedShows: new Map([[1, new Map()]]),
        watchlist: { movie: new Set([1, 2]), show: new Set() },
        ratings: { movie: new Map([[2, 9]]), show: new Map([[3, 7]]), season: new Map(), episode: new Map() },
        favorites: { movie: new Set([4]), show: new Set([1]) },
      }),
    ).toBe(5);
  });
});
