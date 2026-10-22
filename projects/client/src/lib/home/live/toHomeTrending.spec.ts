import { describe, expect, it } from 'vitest';
import { toHomeTrending } from './toHomeTrending.ts';

describe('toHomeTrending', () => {
  it('should map a row to its page, title, year and medium poster', () => {
    const [title] = toHomeTrending('shows', [{
      watchers: 10,
      item: {
        title: 'Slow Horses',
        year: 2022,
        ids: { slug: 'slow-horses' },
        images: { poster: ['media.trakt.tv/images/shows/000/1/posters/thumb/a.jpg.webp'] },
      },
    }]);

    expect(title).toEqual({
      key: 'shows-slow-horses',
      type: 'shows',
      slug: 'slow-horses',
      title: 'Slow Horses',
      year: 2022,
      href: '/shows/slow-horses',
      poster: 'https://media.trakt.tv/images/shows/000/1/posters/medium/a.jpg.webp',
    });
  });

  it('should leave the poster out when the title has none', () => {
    const [title] = toHomeTrending('movies', [{ watchers: 1, item: { title: 'Buddy', ids: { slug: 'buddy' } } }]);

    expect(title?.poster).toBeUndefined();
    expect(title?.title).toBe('Buddy');
  });
});
