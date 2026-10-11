import type { MovieResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { toBoxOfficeRow } from './toBoxOfficeRow.ts';

const movie = {
  title: 'Verity',
  year: 2026,
  ids: { trakt: 1043653, slug: 'verity-2026' },
  released: '2026-10-02',
  runtime: 114,
  certification: 'R',
  genres: ['thriller', 'science-fiction', 'mystery'],
  rating: 7.0,
  images: { poster: ['media.trakt.tv/images/movies/001/043/653/posters/medium/a.jpg.webp'] },
} as unknown as MovieResponse;

describe('mapper: toBoxOfficeRow', () => {
  it('should map a box office row with its gross, run and pills', () => {
    expect(toBoxOfficeRow({ revenue: 33000000, movie }, '2026-10-02')).toEqual({
      id: 1043653,
      href: '/movies/verity-2026',
      title: 'Verity',
      year: 2026,
      poster: 'https://media.trakt.tv/images/movies/001/043/653/posters/thumb/a.jpg.webp',
      tags: [{ text: 'R', kind: 'badge' }, { text: '1h 54m' }, { text: 'Thriller' }, { text: 'Science Fiction' }],
      run: { kind: 'opening', label: 'Opening' },
      revenue: 33000000,
      rating: 7,
      runtime: 114,
    });
  });

  it('should leave out pills it has nothing for and count a missing gross as 0', () => {
    const bare = { ...movie, certification: null, runtime: 60, genres: [] } as unknown as MovieResponse;

    expect(toBoxOfficeRow({ movie: bare }, '2026-10-02')).toMatchObject({ tags: [{ text: '1h' }], revenue: 0 });
  });
});
