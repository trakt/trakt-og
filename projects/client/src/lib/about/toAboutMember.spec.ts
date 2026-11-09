import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_AVATAR } from '../users/placeholderAvatar.ts';
import { toAboutMember } from './toAboutMember.ts';

const user = {
  username: 'justin',
  name: 'Justin',
  ids: { slug: 'justin', trakt: 1 },
  location: 'United States',
  joined_at: '2010-09-25T17:49:25.000Z',
};

const goonies = {
  type: 'movie' as const,
  movie: {
    title: 'The Goonies',
    year: 1985,
    ids: { trakt: 4633, slug: 'the-goonies-1985' },
  },
};

const bsg = {
  type: 'show' as const,
  show: { title: 'Battlestar Galactica', year: 2004, ids: { trakt: 1411, slug: 'battlestar-galactica-2004' } },
};

const stats = { movies: { watched: 1535 }, episodes: { watched: 12121 } };

describe('toAboutMember', () => {
  it('should read a member, their year and what they have watched', () => {
    const member = toAboutMember({ user, favorites: [goonies], stats });

    expect(member).toMatchObject({
      slug: 'justin',
      name: 'Justin',
      location: 'United States',
      since: 2010,
      episodes: 12121,
      movies: 1535,
    });
  });

  it('should build the avatar from their Trakt id', () => {
    expect(toAboutMember({ user, favorites: [], stats }).avatar).toBe('https://media.trakt.tv/users/1/avatar.webp');
  });

  it('should keep each favorite fanart full size, for the cover', () => {
    const member = toAboutMember({ user, favorites: [goonies, bsg], stats });

    expect(member.favorites.at(0)?.fanart).toBe('https://media.trakt.tv/movies/4633/full/fanart.webp');
  });

  it('should link each favorite with its poster and fanart', () => {
    const member = toAboutMember({ user, favorites: [goonies, bsg], stats });

    expect(member.favorites).toEqual([
      {
        key: 'movie-the-goonies-1985',
        title: 'The Goonies',
        year: 1985,
        href: '/movies/the-goonies-1985',
        poster: 'https://media.trakt.tv/movies/4633/medium/poster.webp',
        fanart: 'https://media.trakt.tv/movies/4633/full/fanart.webp',
      },
      {
        key: 'show-battlestar-galactica-2004',
        title: 'Battlestar Galactica',
        year: 2004,
        href: '/shows/battlestar-galactica-2004',
        poster: 'https://media.trakt.tv/shows/1411/medium/poster.webp',
        fanart: 'https://media.trakt.tv/shows/1411/full/fanart.webp',
      },
    ]);
  });

  it('should keep ten favorites at most', () => {
    const member = toAboutMember({ user, favorites: Array.from({ length: 12 }, () => goonies), stats });

    expect(member.favorites).toHaveLength(10);
  });

  describe('for a sparse profile', () => {
    it('should fall back to the username, the placeholder avatar and no cover', () => {
      const member = toAboutMember({
        user: { username: 'andrac', ids: { slug: null }, name: ' ' },
        favorites: [],
        stats: null,
      });

      expect(member).toMatchObject({
        slug: 'andrac',
        name: 'andrac',
        avatar: PLACEHOLDER_AVATAR,
        location: null,
        since: null,
        favorites: [],
        episodes: 0,
        movies: 0,
      });
    });
  });
});
