import type { LastActivitiesResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { calendarKey } from './calendarKey.ts';

const activity = (overrides: Record<string, Record<string, string>> = {}) =>
  ({
    movies: { watched_at: 'm1', collected_at: 'c1', watchlisted_at: 'w1', hidden_at: 'h1', rated_at: 'r1' },
    episodes: { watched_at: 'e1', collected_at: 'ec1', rated_at: 'er1' },
    shows: { watchlisted_at: 'sw1', hidden_at: 'sh1', dropped_at: 'sd1', rated_at: 'sr1', commented_at: 'sc1' },
    ...overrides,
  }) as unknown as LastActivitiesResponse;

const NOW = new Date('2026-11-18T12:00:00.000Z');
const key = (params: Partial<Parameters<typeof calendarKey>[0]> = {}) =>
  JSON.stringify(
    calendarKey({
      activities: activity(),
      slug: 'shows-movies',
      start: '2026-11-01',
      query: {},
      timeZone: 'UTC',
      hideSpecials: false,
      now: NOW,
      ...params,
    }),
  );

describe('calendarKey', () => {
  it('should hold while only unrelated activity moves', () => {
    expect(key({ activities: activity({ shows: { ...activity().shows, commented_at: 'sc2' } as never }) })).toBe(key());
  });

  it.each([
    ['a movie play', { movies: { watched_at: 'm2' } }],
    ['a movie collected', { movies: { collected_at: 'c2' } }],
    ['a movie watchlisted', { movies: { watchlisted_at: 'w2' } }],
    ['a movie hidden', { movies: { hidden_at: 'h2' } }],
    ['an episode play', { episodes: { watched_at: 'e2' } }],
    ['an episode collected', { episodes: { collected_at: 'ec2' } }],
    ['a show watchlisted', { shows: { watchlisted_at: 'sw2' } }],
    ['a show hidden', { shows: { hidden_at: 'sh2' } }],
    ['a show dropped', { shows: { dropped_at: 'sd2' } }],
  ])('should move with %s', (_, overrides) => {
    const base = activity();
    const merged = Object.fromEntries(
      Object.entries(overrides).map(([group, stamps]) => [
        group,
        { ...(base as unknown as Record<string, object>)[group], ...stamps },
      ]),
    );
    expect(key({ activities: activity(merged) })).not.toBe(key());
  });

  it('should move with a rating only when a filter is on', () => {
    const rated = activity({ shows: { ...activity().shows, rated_at: 'sr2' } as never });
    expect(key({ activities: rated })).toBe(key());
    expect(key({ activities: rated, query: { ratings: '8-10' } })).not.toBe(key({ query: { ratings: '8-10' } }));
  });

  it.each([
    ['the month', { start: '2026-12-01' }],
    ['the calendar', { slug: 'movies' }],
    ['the filters', { query: { genres: 'drama' } }],
    ['the time zone', { timeZone: 'America/New_York' }],
    ['the specials setting', { hideSpecials: true }],
    ['the day', { now: new Date('2026-11-19T12:00:00.000Z') }],
  ])('should move with %s', (_, params) => {
    expect(key(params)).not.toBe(key());
  });

  it("should roll over with the day in the viewer's zone", () => {
    const late = new Date('2026-11-18T23:30:00.000Z');
    expect(key({ now: late, timeZone: 'America/Los_Angeles' })).toBe(
      key({ now: NOW, timeZone: 'America/Los_Angeles' }),
    );
  });
});
