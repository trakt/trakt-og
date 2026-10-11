import type { MovieResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { toOpeningRow } from './toOpeningRow.ts';

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

describe('mapper: toOpeningRow', () => {
  it('should link the film with its poster and short pills', () => {
    expect(toOpeningRow({ movie })).toEqual({
      id: 1043653,
      href: '/movies/verity-2026',
      title: 'Verity',
      poster: 'https://media.trakt.tv/images/movies/001/043/653/posters/thumb/a.jpg.webp',
      tags: [{ text: 'R', kind: 'badge' }, { text: '1h 54m' }, { text: 'Thriller' }],
    });
  });
});
