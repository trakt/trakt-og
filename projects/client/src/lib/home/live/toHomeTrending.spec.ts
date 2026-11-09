import { describe, expect, it } from 'vitest';
import { toHomeTrending } from './toHomeTrending.ts';

describe('toHomeTrending', () => {
  it('should map a row to its page, title, year and medium poster', () => {
    const [title] = toHomeTrending('shows', [
      {
        watchers: 10,
        item: {
          title: 'Slow Horses',
          year: 2022,
          ids: { trakt: 1390, slug: 'slow-horses' },
        },
      },
    ]);

    expect(title).toEqual({
      key: 'shows-slow-horses',
      type: 'shows',
      slug: 'slow-horses',
      title: 'Slow Horses',
      year: 2022,
      href: '/shows/slow-horses',
      poster: 'https://media.trakt.tv/shows/1390/medium/poster.webp',
    });
  });

  it('should build a movie poster from its id', () => {
    const [title] = toHomeTrending('movies', [
      { watchers: 1, item: { title: 'Buddy', ids: { trakt: 7, slug: 'buddy' } } },
    ]);

    expect(title?.poster).toBe('https://media.trakt.tv/movies/7/medium/poster.webp');
  });
});
