import { describe, expect, it } from 'vitest';
import { type HomeWatchingSource, toHomeLive } from './toHomeLive.ts';

const source = (
  type: HomeWatchingSource['type'],
  title: string,
  watchers: HomeWatchingSource['watchers'],
): HomeWatchingSource => ({ type, title, href: `/${type}/${title.toLowerCase()}`, watchers });

const TOTAL = { shows: 219_022, movies: 26_308 };
const people = (prefix: string, count: number, location: string) =>
  Array.from({ length: count }, (_, i) => ({ username: `${prefix}${i}`, location }));

describe('toHomeLive', () => {
  it("should keep Trending's totals for shows and movies", () => {
    const live = toHomeLive(TOTAL, [source('shows', 'Severance', [{ username: 'a' }])]);

    expect([live.shows, live.movies]).toEqual([219_022, 26_308]);
  });

  it('should give each country its share of everyone on the map, each person once, most first', () => {
    const live = toHomeLive(TOTAL, [
      source('shows', 'Severance', [
        { username: 'a', location: 'Brazil' },
        { username: 'b', location: 'London, United Kingdom' },
        { username: 'c', location: 'Manchester, England' },
      ]),
      source('shows', 'Fringe', [{ username: 'a', location: 'Brazil' }]),
      source('movies', 'Tron', [{ username: 'd', location: 'UK' }]),
    ]);

    expect(live.countries.map(({ code, name, share }) => ({ code, name, share }))).toEqual([
      { code: 'GB', name: 'United Kingdom', share: 0.75 },
      { code: 'BR', name: 'Brazil', share: 0.25 },
    ]);
  });

  it("should give a country's shows share and most watched title once five people are there", () => {
    const live = toHomeLive(TOTAL, [
      source('shows', 'Severance', people('s', 2, 'Spain')),
      source('movies', 'Tron', people('m', 3, 'Madrid, Spain')),
    ]);

    expect(live.countries.at(0)?.watching).toEqual({
      shows: 0.4,
      top: { type: 'movies', title: 'Tron', href: '/movies/tron' },
    });
  });

  it('should keep what fewer than five people are watching off the page', () => {
    const live = toHomeLive(TOTAL, [source('shows', 'Severance', people('s', 4, 'Iceland'))]);

    expect(live.countries).toEqual([{ code: 'IS', name: 'Iceland', share: 1 }]);
  });

  it('should leave people without a known location off the map and out of the shares', () => {
    const live = toHomeLive(TOTAL, [
      source('shows', 'Severance', [
        { username: 'a', location: null },
        { username: 'b' },
        { username: 'c', location: 'Chile' },
      ]),
    ]);

    expect(live.countries.map(({ code, share }) => ({ code, share }))).toEqual([{ code: 'CL', share: 1 }]);
  });
});
