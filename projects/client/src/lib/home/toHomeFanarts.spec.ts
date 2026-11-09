import { describe, expect, it } from 'vitest';
import { toHomeFanarts } from './toHomeFanarts.ts';

describe('toHomeFanarts', () => {
  it('should map movies and shows to their full-size fanart and page', () => {
    expect(
      toHomeFanarts([
        { type: 'movie', id: 4633, slug: 'the-goonies-1985', title: 'The Goonies' },
        { type: 'show', id: 1388, slug: 'breaking-bad', title: 'Breaking Bad' },
      ]),
    ).toEqual([
      {
        key: 'movie-the-goonies-1985',
        title: 'The Goonies',
        href: '/movies/the-goonies-1985',
        image: 'https://media.trakt.tv/movies/4633/full/fanart.webp',
      },
      {
        key: 'show-breaking-bad',
        title: 'Breaking Bad',
        href: '/shows/breaking-bad',
        image: 'https://media.trakt.tv/shows/1388/full/fanart.webp',
      },
    ]);
  });
});
