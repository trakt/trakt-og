import { describe, expect, it } from 'vitest';
import type { ListItemRow } from '../../../lists/listItemRowsSchema.ts';
import { toFranchiseMovies } from './toFranchiseMovies.ts';

const movie = (id: number, released: string | null, extra: Partial<{ year: number; runtime: number }> = {}) =>
  ({
    type: 'movie',
    rank: 1,
    id,
    listed_at: '2026-01-01T00:00:00.000Z',
    movie: {
      title: `Movie ${id}`,
      year: extra.year ?? 2000,
      ids: { trakt: id, slug: `movie-${id}` },
      runtime: extra.runtime ?? 100,
      released,
      rating: 7.5,
    },
  }) as ListItemRow;

describe('toFranchiseMovies', () => {
  it('should order the movies by release date', () => {
    const movies = toFranchiseMovies([movie(3, '2012-05-01'), movie(1, '1999-01-01'), movie(2, '2005-01-01')]);

    expect(movies.map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  it('should drop a movie without a release date', () => {
    expect(toFranchiseMovies([movie(1, null), movie(2, '2005-01-01')]).map(({ id }) => id)).toEqual([2]);
  });

  it('should leave out anything that is not a movie', () => {
    const show = { type: 'show', id: 9, rank: 1, listed_at: '', show: {} } as unknown as ListItemRow;

    expect(toFranchiseMovies([show, movie(2, '2005-01-01')])).toHaveLength(1);
  });

  it('should map the movie page, a sized poster and fanart, and the rating', () => {
    expect(toFranchiseMovies([movie(2, '2005-01-01', { runtime: 120 })])).toEqual([
      {
        id: 2,
        title: 'Movie 2',
        year: 2000,
        href: '/movies/movie-2',
        poster: 'https://media.trakt.tv/movies/2/medium/poster.webp',
        fanart: 'https://media.trakt.tv/movies/2/medium/fanart.webp',
        rating: 7.5,
        released: '2005-01-01',
        runtime: 120,
      },
    ]);
  });
});
