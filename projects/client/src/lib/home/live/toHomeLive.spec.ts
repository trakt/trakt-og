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
        ...people('l', 8, 'London, United Kingdom'),
        { username: 'a', location: 'Brazil' },
      ]),
      source('shows', 'Fringe', [{ username: 'a', location: 'Brazil' }, ...people('b', 4, 'Brazil')]),
      source('movies', 'Tron', people('u', 7, 'UK')),
    ]);

    expect(live.countries.map(({ code, name, share }) => ({ code, name, share }))).toEqual([
      { code: 'GB', name: 'United Kingdom', share: 0.75 },
      { code: 'BR', name: 'Brazil', share: 0.25 },
    ]);
  });

  it("should round shares to a tenth of a percent, so they can't be worked back into people", () => {
    const live = toHomeLive(TOTAL, [
      source('shows', 'Severance', [...people('g', 7, 'UK'), ...people('f', 6, 'France')]),
    ]);

    expect(live.countries.map(({ share }) => share)).toEqual([0.538, 0.462]);
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

  it('should give every country with fewer than five people the same floor share, by name, and no split', () => {
    const live = toHomeLive(TOTAL, [
      source('shows', 'Severance', [
        ...people('s', 6, 'Spain'),
        ...people('i', 4, 'Iceland'),
        ...people('m', 1, 'Malta'),
      ]),
    ]);

    expect(live.countries.slice(1)).toEqual([
      { code: 'IS', name: 'Iceland', share: 0.0005 },
      { code: 'MT', name: 'Malta', share: 0.0005 },
    ]);
  });

  it('should leave people without a known location off the map and out of the shares', () => {
    const live = toHomeLive(TOTAL, [
      source('shows', 'Severance', [{ username: 'a', location: null }, { username: 'b' }, ...people('c', 5, 'Chile')]),
    ]);

    expect(live.countries.map(({ code, share }) => ({ code, share }))).toEqual([{ code: 'CL', share: 1 }]);
  });
});
