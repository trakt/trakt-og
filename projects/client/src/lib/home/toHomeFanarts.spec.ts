import { describe, expect, it } from 'vitest';
import { toHomeFanarts } from './toHomeFanarts.ts';

describe('toHomeFanarts', () => {
  it('should map movies and shows to their full-size fanart and page', () => {
    expect(toHomeFanarts([
      {
        type: 'movie',
        slug: 'the-goonies-1985',
        title: 'The Goonies',
        fanart: 'media.trakt.tv/images/movies/000/004/633/fanarts/medium/a.jpg.webp',
      },
      {
        type: 'show',
        slug: 'breaking-bad',
        title: 'Breaking Bad',
        fanart: 'media.trakt.tv/images/shows/000/001/388/fanarts/medium/b.jpg.webp',
      },
    ])).toEqual([
      {
        key: 'movie-the-goonies-1985',
        title: 'The Goonies',
        href: '/movies/the-goonies-1985',
        image: 'https://media.trakt.tv/images/movies/000/004/633/fanarts/full/a.jpg.webp',
      },
      {
        key: 'show-breaking-bad',
        title: 'Breaking Bad',
        href: '/shows/breaking-bad',
        image: 'https://media.trakt.tv/images/shows/000/001/388/fanarts/full/b.jpg.webp',
      },
    ]);
  });

  it('should skip titles without fanart', () => {
    expect(toHomeFanarts([
      { type: 'movie', slug: 'a', title: 'A', fanart: undefined },
      { type: 'show', slug: 'b', title: 'B', fanart: '' },
    ])).toEqual([]);
  });
});
