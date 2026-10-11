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
  it('should say which day it opens, or Today', () => {
    expect(toOpeningRow({ released: '2026-10-16', movie }, '2026-10-10')).toMatchObject({
      href: '/movies/verity-2026',
      day: 'Fri, Oct 16',
      tags: [{ text: 'R', kind: 'light' }, { text: 'Thriller' }],
    });
    expect(toOpeningRow({ released: '2026-10-10', movie }, '2026-10-10').day).toBe('Today');
  });
});
