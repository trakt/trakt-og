import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_AVATAR } from '../components/comments/authorOf.ts';
import { toListCard } from './toListCard.ts';

const list = {
  ids: { trakt: 10 },
  name: 'Popular Horror',
  description: '**UPDATED** _2024-01-19_\r\nSee [IMDB](https://imdb.com) https://example.com/x',
  allow_comments: true,
  item_count: 501,
  comment_count: 2,
  likes: 1138,
  images: {
    posters: Array.from({ length: 8 }, (_, index) => `media.trakt.tv/images/${index}/posters/medium/a.jpg.webp`),
  },
  user: {
    username: 'lish408',
    name: 'LISH ',
    ids: { slug: 'lish408' },
    images: { avatar: { full: 'https://media.trakt.tv/images/users/1/avatars/medium/a.jpg' } },
    vip: true,
    vip_years: 3,
  },
};

describe('toListCard', () => {
  it('should map the name, owner, plain description, counts and the first six posters', () => {
    expect(toListCard(list)).toEqual({
      id: 10,
      href: '/lists/10',
      name: 'Popular Horror',
      owner: {
        name: 'LISH',
        href: '/users/lish408',
        avatar: 'https://media.trakt.tv/images/users/1/avatars/medium/a.jpg',
        vip: { kind: 'vip', tag: null, years: 3 },
      },
      description: 'UPDATED 2024-01-19 See IMDB',
      items: 501,
      likes: 1138,
      comments: 2,
      posters: [0, 1, 2, 3, 4, 5].map((index) => `https://media.trakt.tv/images/${index}/posters/thumb/a.jpg.webp`),
    });
  });

  it('should keep each poster once', () => {
    const repeated = {
      ...list,
      images: { posters: ['a', 'a', 'b', 'a'].map((name) => `media.trakt.tv/${name}/posters/medium/p.jpg`) },
    };

    expect(toListCard(repeated).posters).toEqual([
      'https://media.trakt.tv/a/posters/thumb/p.jpg',
      'https://media.trakt.tv/b/posters/thumb/p.jpg',
    ]);
  });

  it('should fall back to the username and the placeholder avatar', () => {
    const card = toListCard({ ...list, user: { username: 'sean' } });

    expect(card.owner).toEqual({ name: 'sean', href: '/users/sean', avatar: PLACEHOLDER_AVATAR, vip: null });
  });

  it('should leave out an empty description and the comments when they are off', () => {
    const card = toListCard({ ...list, description: '  ', allow_comments: false, likes: null, images: null });

    expect(card).toMatchObject({ description: undefined, comments: undefined, likes: 0, posters: [] });
  });
});
