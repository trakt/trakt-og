import { describe, expect, it } from 'vitest';
import type { OverlaySlices } from '../overlay/OverlaySlices.ts';
import { gettingStartedSteps, isRecentMember } from './gettingStarted.ts';

const ids = (count: number, from = 1) => new Set(Array.from({ length: count }, (_, i) => from + i));
const byId = <T>(count: number, value: T, from = 1) => new Map([...ids(count, from)].map((id) => [id, value]));

const slices = (overrides: Partial<OverlaySlices> = {}): Partial<OverlaySlices> => ({
  watchedMovies: new Map(),
  watchedShows: new Map(),
  watchlist: { movie: new Set(), show: new Set() },
  ratings: { movie: new Map(), show: new Map(), season: new Map(), episode: new Map() },
  network: { following: new Set(), followers: new Set() },
  ...overrides,
});

const steps = (overrides: Partial<OverlaySlices> = {}, named = false, marks = {}) =>
  gettingStartedSteps({ slices: slices(overrides), slug: 'jordan', named, marks });

const done = (list: ReturnType<typeof steps>) => list?.filter((step) => step.done).map((step) => step.key);

describe('isRecentMember', () => {
  const now = Date.parse('2026-10-23T12:00:00Z');

  it('should count a member who joined within 30 days as recent', () => {
    expect(isRecentMember('2026-10-01T00:00:00Z', now)).toBe(true);
  });

  it('should not count a member who joined longer ago', () => {
    expect(isRecentMember('2026-09-01T00:00:00Z', now)).toBe(false);
  });

  it('should not count a member without a join date', () => {
    expect(isRecentMember(null, now)).toBe(false);
  });
});

describe('gettingStartedSteps', () => {
  it('should wait until the overlay has every slice it counts from', () => {
    expect(gettingStartedSteps({ slices: {}, slug: 'jordan', named: false, marks: {} })).toBeNull();
    expect(steps({ network: undefined })).toBeNull();
  });

  it('should list the six tickets with the name first and none done for a new account', () => {
    const list = steps();
    expect(list?.map((step) => step.key)).toEqual(['name', 'pilot', 'watchlist', 'ratings', 'apps', 'follows']);
    expect(done(list)).toEqual([]);
  });

  it('should admit each ticket once its threshold is reached', () => {
    const list = steps(
      {
        watchedMovies: byId(6, ['2026-10-01']),
        watchedShows: byId(4, new Map(), 100),
        watchlist: { movie: ids(3), show: ids(2, 50) },
        ratings: { movie: byId(5, 8), show: new Map(), season: new Map(), episode: new Map() },
        network: { following: new Set(['a', 'b', 'c']), followers: new Set() },
      },
      true,
      { apps: true },
    );
    expect(done(list)).toEqual(['name', 'pilot', 'watchlist', 'ratings', 'apps', 'follows']);
  });

  it('should leave a ticket open one short of its threshold', () => {
    const list = steps({
      watchedMovies: byId(9, ['2026-10-01']),
      watchlist: { movie: ids(4), show: new Set() },
      network: { following: new Set(['a', 'b']), followers: new Set() },
    });
    expect(done(list)).toEqual([]);
  });

  it("should link the name ticket to the member's own profile", () => {
    expect(steps()?.find((step) => step.key === 'name')?.href).toBe('/users/jordan');
  });
});
