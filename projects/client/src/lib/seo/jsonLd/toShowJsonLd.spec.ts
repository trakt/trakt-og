import { describe, expect, it } from 'vitest';
import { toShowJsonLd } from './toShowJsonLd.ts';

const show = {
  title: 'Severance',
  href: '/shows/severance',
  overview: 'Mark leads a team of office workers.',
  poster: 'https://media.trakt.tv/images/shows/posters/medium/a.jpg.webp',
  fanart: undefined,
  certification: 'TV-MA',
  rating: { value: 8.6, votes: 30, href: '' },
  links: [{ label: 'TMDB', href: 'https://www.themoviedb.org/tv/95396' }],
  firstAired: '2022-02-18T02:00:00.000Z',
  airedEpisodes: 19,
  facts: { genres: [{ name: 'Drama', href: '' }] },
};

describe('seo: toShowJsonLd', () => {
  it('should describe the show as a schema.org TVSeries', () => {
    expect(toShowJsonLd(show)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'TVSeries',
      name: 'Severance',
      description: 'Mark leads a team of office workers.',
      url: 'https://og.trakt.tv/shows/severance',
      image: 'https://media.trakt.tv/images/shows/posters/medium/a.jpg',
      genre: ['Drama'],
      startDate: '2022-02-18',
      numberOfEpisodes: 19,
      contentRating: 'TV-MA',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 8.6,
        bestRating: 10,
        worstRating: 1,
        ratingCount: 30,
      },
      sameAs: ['https://www.themoviedb.org/tv/95396'],
    });
  });

  it('should leave out an unaired show’s rating, start and episodes', () => {
    const data = toShowJsonLd({ ...show, rating: undefined, firstAired: null, airedEpisodes: 0 });

    expect(data).not.toHaveProperty('aggregateRating');
    expect(data).not.toHaveProperty('startDate');
    expect(data).not.toHaveProperty('numberOfEpisodes');
  });
});
