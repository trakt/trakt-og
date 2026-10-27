import { describe, expect, it } from 'vitest';
import { toMovieSeo } from './toMovieSeo.ts';

const movie = {
  fullTitle: 'Inception (2010)',
  overview: 'Cobb steals secrets from dreams.',
  fanart: 'https://media.trakt.tv/images/movies/fanarts/full/a.jpg.webp',
  poster: 'https://media.trakt.tv/images/movies/posters/medium/b.jpg.webp',
};

describe('seo: toMovieSeo', () => {
  it('should title the movie with its year and describe it with its overview and fanart', () => {
    expect(toMovieSeo(movie)).toEqual({
      title: 'Inception (2010)',
      description: 'Cobb steals secrets from dreams.',
      image: movie.fanart,
      imageAlt: 'Inception (2010)',
      type: 'video.movie',
    });
  });

  it('should fall back to a fixed line without an overview', () => {
    expect(toMovieSeo({ ...movie, overview: null }).description).toBe(
      'Where to watch Inception (2010), its ratings, comments and lists on Trakt.',
    );
  });

  it('should fall back to the poster, then the default image, without fanart', () => {
    expect(toMovieSeo({ ...movie, fanart: undefined }).image).toBe(movie.poster);
    expect(toMovieSeo({ ...movie, fanart: undefined, poster: undefined }).image).toBeUndefined();
  });
});
