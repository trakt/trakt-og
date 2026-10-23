import { describe, expect, it } from 'vitest';
import { featuredLists } from './featuredLists.ts';
import { toEssentialList } from './toEssentialList.ts';

const [imdb] = featuredLists;
const list = {
  ids: { trakt: 2_142_753 },
  name: 'IMDB Top 250',
  description: 'Top 250 movies, as rated by **IMDB** voters.',
  allow_comments: true,
  item_count: 250,
  comment_count: 6,
  likes: 6061,
  images: { posters: ['media.trakt.tv/a/posters/medium/p.jpg', 'media.trakt.tv/a/posters/medium/p.jpg'] },
  user: { username: 'justin' },
};

describe('toEssentialList', () => {
  it('should add the list description, counts and different posters to the art', () => {
    if (!imdb) throw new Error('no essentials');

    expect(toEssentialList(imdb, list)).toEqual({
      ...imdb,
      href: '/lists/2142753',
      description: 'Top 250 movies, as rated by IMDB voters.',
      ownerSlug: 'justin',
      counts: { items: 250, likes: 6061, comments: 6 },
      posters: ['https://media.trakt.tv/a/posters/thumb/p.jpg'],
    });
  });

  it("should link the loaded list's own page", () => {
    if (!imdb) throw new Error('no essentials');
    const official = { ...list, type: 'official', ids: { trakt: 2_142_753, slug: 'imdb-top-250' } };

    expect(toEssentialList(imdb, official).href).toBe('/lists/official/imdb-top-250');
  });

  it('should keep the art and title when the list did not load', () => {
    if (!imdb) throw new Error('no essentials');

    expect(toEssentialList(imdb, null)).toEqual({ ...imdb, href: '/lists/2142753', posters: [] });
  });
});
