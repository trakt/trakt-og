import { describe, expect, it } from 'vitest';
import { toProfileUser } from '../toProfileUser.ts';
import { toBuiltInRow } from './toBuiltInRow.ts';

const profile = toProfileUser({ username: 'tester', name: 'Tester', private: false, ids: { slug: 'tester' } });
const ids = (trakt: number) => ({ ids: { trakt } });

describe('toBuiltInRow', () => {
  it('should title each poster and use the show poster for seasons and episodes', () => {
    const row = toBuiltInRow({
      kind: 'watchlist',
      profile,
      itemCount: 315,
      items: [
        { type: 'movie', movie: { title: 'Heat', ...ids(1) } },
        { type: 'show', show: { title: 'Severance', ...ids(2) } },
        { type: 'season', show: { title: 'Lost', ...ids(3) }, season: { number: 2, ...ids(30) } },
        { type: 'episode', show: { title: 'Lost', ...ids(3) }, episode: { title: 'Pilot', ...ids(300) } },
      ],
    });
    expect(row.posters).toEqual([
      { title: 'Heat', image: 'https://media.trakt.tv/movies/1/thumb/poster.webp' },
      { title: 'Severance', image: 'https://media.trakt.tv/shows/2/thumb/poster.webp' },
      {
        title: 'Lost Season 2',
        image: `https://media.trakt.tv/seasons/30/thumb/poster.webp#fallback=${encodeURIComponent('https://media.trakt.tv/shows/3/thumb/poster.webp')}`,
      },
      { title: 'Lost: Pilot', image: 'https://media.trakt.tv/shows/3/thumb/poster.webp' },
    ]);
  });

  it("should name the row, link it and leave out likes and comments, with OG's default description", () => {
    const row = toBuiltInRow({ kind: 'favorites', profile, itemCount: 51, items: [] });
    expect(row).toMatchObject({
      key: 'favorites',
      id: null,
      kind: 'favorites',
      name: 'Favorites',
      href: '/users/tester/favorites',
      owner: { slug: 'tester', name: 'Tester', href: '/users/tester' },
      itemCount: 51,
    });
    expect([row.likeCount, row.commentCount, row.description]).toEqual([
      undefined,
      undefined,
      'My favorite shows and movies.',
    ]);
    expect(toBuiltInRow({ kind: 'watchlist', profile, itemCount: 0, items: [] }).name).toBe('Watchlist');
  });
});
