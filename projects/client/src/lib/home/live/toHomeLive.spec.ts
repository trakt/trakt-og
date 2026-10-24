import { describe, expect, it } from 'vitest';
import { type HomeWatchingSource, toHomeLive } from './toHomeLive.ts';

const source = (
  type: HomeWatchingSource['type'],
  title: string,
  watchers: HomeWatchingSource['watchers'],
): HomeWatchingSource => ({ type, title, href: `/${type}/${title.toLowerCase()}`, watchers });

describe('toHomeLive', () => {
  it('should count shows against movies, each person once', () => {
    const live = toHomeLive([
      source('shows', 'Severance', [{ username: 'a' }, { username: 'b' }]),
      source('shows', 'Fringe', [{ username: 'a' }]),
      source('movies', 'Tron', [{ username: 'c' }]),
    ]);

    expect(live.shows).toBe(2);
    expect(live.movies).toBe(1);
  });

  it('should group people by the country their location names, most first', () => {
    const live = toHomeLive([
      source('shows', 'Severance', [
        { username: 'a', location: 'Brazil' },
        { username: 'b', location: 'London, United Kingdom' },
        { username: 'c', location: 'Manchester, England' },
      ]),
      source('movies', 'Tron', [
        { username: 'd', location: 'Brasil' },
        { username: 'e', location: 'UK' },
      ]),
    ]);

    expect(live.countries.map(({ code, shows, movies }) => ({ code, shows, movies }))).toEqual([
      { code: 'GB', shows: 2, movies: 1 },
      { code: 'BR', shows: 1, movies: 1 },
    ]);
    expect(live.countries.at(0)?.name).toBe('United Kingdom');
  });

  it("should name each country's most watched title", () => {
    const live = toHomeLive([
      source('shows', 'Severance', [{ username: 'a', location: 'Spain' }]),
      source('movies', 'Tron', [
        { username: 'b', location: 'Spain' },
        { username: 'c', location: 'Madrid, Spain' },
      ]),
    ]);

    expect(live.countries.at(0)?.top).toEqual({ type: 'movies', title: 'Tron', href: '/movies/tron' });
  });

  it('should count people without a known location but leave them off the map', () => {
    const live = toHomeLive([source('shows', 'Severance', [{ username: 'a', location: null }, { username: 'b' }])]);

    expect(live.shows).toBe(2);
    expect(live.countries).toEqual([]);
  });
});
