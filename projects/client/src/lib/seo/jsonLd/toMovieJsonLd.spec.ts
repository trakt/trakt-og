import { describe, expect, it } from 'vitest';
import { toMovieJsonLd } from './toMovieJsonLd.ts';

const movie = {
  title: 'Inception',
  href: '/movies/inception-2010',
  overview: 'Cobb steals secrets from dreams.',
  poster: 'https://media.trakt.tv/images/movies/posters/medium/a.jpg.webp',
  fanart: 'https://media.trakt.tv/images/movies/fanarts/full/b.jpg.webp',
  certification: 'PG-13',
  rating: { value: 8.71, votes: 50000, href: '/movies/inception-2010/stats' },
  links: [{ label: 'IMDB', href: 'https://www.imdb.com/title/tt1375666' }],
  facts: {
    genres: [{ name: 'Action', href: '' }],
    released: { date: '2010-07-16', upcoming: false, more: 0 },
    runtime: 148,
  },
};

describe('seo: toMovieJsonLd', () => {
  it('should describe the movie as a schema.org Movie', () => {
    expect(toMovieJsonLd(movie)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: 'Inception',
      description: 'Cobb steals secrets from dreams.',
      url: 'https://og.trakt.tv/movies/inception-2010',
      image: 'https://media.trakt.tv/images/movies/posters/medium/a.jpg',
      genre: ['Action'],
      datePublished: '2010-07-16',
      duration: 'PT2H28M',
      contentRating: 'PG-13',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 8.7,
        bestRating: 10,
        worstRating: 1,
        ratingCount: 50000,
      },
      sameAs: ['https://www.imdb.com/title/tt1375666'],
    });
  });

  it('should drop what the movie lacks instead of sending null', () => {
    const data = toMovieJsonLd({
      ...movie,
      overview: null,
      poster: undefined,
      fanart: undefined,
      certification: null,
      rating: { value: 10, votes: 1, href: '' },
      links: [],
      facts: { genres: [], released: undefined, runtime: undefined },
    });

    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: 'Inception',
      url: 'https://og.trakt.tv/movies/inception-2010',
    });
  });
});
