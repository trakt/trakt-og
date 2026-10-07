import { describe, expect, it } from 'vitest';
import { toPosterItem } from './toPosterItem.ts';

const now = new Date('2026-10-07T00:00:00Z');
const media = {
  ids: { trakt: 7, slug: 'frankenstein-2025' },
  title: 'Frankenstein',
  year: 2025,
  runtime: 150,
  rating: 7.9,
  released: '2025-10-17',
  aired_episodes: null,
  genres: ['horror', 'science-fiction', 'drama', 'war'],
  certification: 'R',
  overview: ' A creature. ',
  trailer: 'https://youtube.com/watch?v=abc',
  images: {
    poster: ['media.trakt.tv/images/movies/7/posters/medium/a.jpg.webp'],
    fanart: ['media.trakt.tv/images/movies/7/fanarts/medium/b.jpg.webp'],
    logo: ['media.trakt.tv/images/movies/7/logos/medium/c.png.webp'],
  },
};

describe('toPosterItem', () => {
  it('should map a movie with its runtime, a thumb poster and full fanart', () => {
    expect(toPosterItem(media, 'movie', now)).toEqual({
      key: 'movie-7',
      type: 'movie',
      id: 7,
      href: '/movies/frankenstein-2025',
      title: 'Frankenstein',
      year: 2025,
      runtime: 150,
      rating: 7.9,
      released: true,
      airedEpisodes: undefined,
      poster: 'https://media.trakt.tv/images/movies/7/posters/thumb/a.jpg.webp',
      fanart: 'https://media.trakt.tv/images/movies/7/fanarts/full/b.jpg.webp',
      logo: 'https://media.trakt.tv/images/movies/7/logos/medium/c.png.webp',
      genres: 'Horror, Science fiction, Drama',
      certification: 'R',
      network: undefined,
      overview: 'A creature.',
      trailer: 'https://youtube.com/watch?v=abc',
    });
  });

  it("should leave out a show's episode runtime and any missing art", () => {
    const item = toPosterItem({ ...media, images: null, aired_episodes: 8 }, 'show', now);

    expect(item).toMatchObject({
      key: 'show-7',
      href: '/shows/frankenstein-2025',
      runtime: undefined,
      airedEpisodes: 8,
    });
    // A show without a first air date isn't out yet.
    expect(item.released).toBe(false);
    expect(item.poster).toBeUndefined();
    expect(item.fanart).toBeUndefined();
  });
});
