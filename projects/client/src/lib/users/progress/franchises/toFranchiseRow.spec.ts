import { describe, expect, it } from 'vitest';
import type { FranchiseMovie } from './FranchiseMovie.ts';
import { toFranchiseRow } from './toFranchiseRow.ts';

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'America/Los_Angeles', weekStartDay: 0 } as const;
const now = new Date('2026-09-30T20:00:00.000Z');
const franchise = { id: 5, slug: 'saga-collection', name: 'Saga Collection' };

const movie = (id: number, released: string, runtime = 100): FranchiseMovie => ({
  id,
  title: `Movie ${id}`,
  year: Number(released.slice(0, 4)),
  href: `/movies/movie-${id}`,
  released,
  runtime,
});

const movies = [
  movie(1, '2001-01-01', 90),
  movie(2, '2003-01-01', 100),
  movie(3, '2005-01-01', 110),
  movie(4, '2007-01-01', 120),
  movie(5, '2027-01-01', 130),
];

const row = (plays: Record<number, string[]>, list = movies) =>
  toFranchiseRow({
    franchise,
    movies: list,
    plays: new Map(Object.entries(plays).map(([id, d]) => [Number(id), d])),
    datePreferences,
    now,
  });

describe('toFranchiseRow', () => {
  it('should link the official list and span the release years', () => {
    expect(row({ 1: ['2026-09-01T00:00:00.000Z'] })).toMatchObject({
      id: 5,
      title: 'Saga Collection',
      href: '/lists/official/saga-collection',
      years: '2001-2027',
    });
  });

  it('should run watched and unwatched movies in release order', () => {
    const { ticks } = row({
      1: ['2026-09-01T00:00:00.000Z'],
      2: ['2026-09-02T00:00:00.000Z'],
      4: ['2026-09-03T00:00:00.000Z'],
    });

    expect(ticks).toEqual([
      { done: true, count: 2 },
      { done: false, count: 1 },
      { done: true, count: 1 },
    ]);
  });

  it('should floor the percent and leave the unreleased movie out of every count', () => {
    const result = row({
      1: ['2026-09-01T00:00:00.000Z'],
      2: ['2026-09-02T00:00:00.000Z'],
      3: ['2026-09-03T00:00:00.000Z'],
    });

    expect(result).toMatchObject({ percent: 75, watched: 3, released: 4, left: 1, leftTime: '2h' });
    expect(result.movies).toHaveLength(5);
    expect(result.ticks.reduce((sum, { count }) => sum + count, 0)).toBe(4);
  });

  it('should floor 2 of 3 to 66%', () => {
    expect(row({ 1: ['2026-09-01T00:00:00.000Z'], 2: ['2026-09-02T00:00:00.000Z'] }, movies.slice(0, 3)).percent).toBe(
      66,
    );
  });

  it('should total plays and the time they took', () => {
    const result = row({
      1: ['2026-08-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z'],
      2: ['2026-09-02T00:00:00.000Z'],
    });

    expect(result.plays).toBe(3);
    expect(result.watchedMinutes).toBe(280);
    expect(result.watchedTime).toBe('4h 40m');
    expect(result.leftTime).toBe('3h 50m');
  });

  it('should name the latest play as last watched, whichever movie it was', () => {
    const result = row({ 3: ['2026-09-29T20:00:00.000Z'], 1: ['2026-09-01T00:00:00.000Z'] });

    expect(result.last).toMatchObject({ title: 'Movie 3', href: '/movies/movie-3', relative: 'a day ago' });
  });

  it('should send up next to the first unwatched released movie', () => {
    const result = row({ 1: ['2026-09-01T00:00:00.000Z'], 3: ['2026-09-03T00:00:00.000Z'] });

    expect(result.feature).toMatchObject({ kind: 'up-next', movie: { id: 2, title: 'Movie 2', year: 2003 } });
  });

  it('should feature the next movie not out yet once every released movie is watched', () => {
    const all = Object.fromEntries([1, 2, 3, 4].map((id) => [id, ['2026-09-01T00:00:00.000Z']]));
    const result = row(all);

    expect(result).toMatchObject({ percent: 100, left: 0, feature: { kind: 'soon', movie: { id: 5 } } });
  });

  it('should mark each movie watched or not for the strip', () => {
    const result = row({ 2: ['2026-09-01T00:00:00.000Z'] });

    expect(result.movies.map(({ watched }) => watched)).toEqual([false, true, false, false, false]);
    expect(result.movies.map(({ released }) => released)).toEqual([true, true, true, true, false]);
  });

  it('should take the left poster from the first released movie', () => {
    const posters = [
      { ...movie(1, '2001-01-01'), poster: 'one.jpg' },
      { ...movie(2, '2003-01-01'), poster: 'two.jpg' },
      { ...movie(3, '2027-01-01'), poster: 'three.jpg' },
    ];

    expect(row({}, posters).poster).toBe('one.jpg');
  });

  it('should have no left poster while nothing is out yet', () => {
    const posters = [
      { ...movie(1, '2027-01-01'), poster: 'soon.jpg' },
      { ...movie(2, '2028-01-01'), poster: 'later.jpg' },
    ];

    expect(row({}, posters).poster).toBeUndefined();
  });

  it('should keep a movie its release date beside whether it is out', () => {
    expect(row({}).movies.at(-1)).toMatchObject({ released: false, releaseDate: '2027-01-01' });
  });

  it('should show a single year once', () => {
    expect(row({ 1: ['2026-09-01T00:00:00.000Z'] }, [movie(1, '2001-01-01'), movie(2, '2001-06-01')]).years).toBe(
      '2001',
    );
  });
});
