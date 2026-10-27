import { describe, expect, it } from 'vitest';
import { toSeasonJsonLd } from './toSeasonJsonLd.ts';

const season = {
  title: 'Season 2',
  number: 2,
  href: '/shows/severance/seasons/2',
  overview: 'Mark and his team return.',
  poster: 'https://media.trakt.tv/images/seasons/posters/medium/a.jpg.webp',
  rating: { value: 8.2, votes: 10, href: '' },
  showTitle: 'Severance',
  showHref: '/shows/severance',
  episodes: [{}, {}, {}],
};

describe('seo: toSeasonJsonLd', () => {
  it('should describe the season as a schema.org TVSeason of its series', () => {
    expect(toSeasonJsonLd(season)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'TVSeason',
      name: 'Season 2',
      description: 'Mark and his team return.',
      url: 'https://og.trakt.tv/shows/severance/seasons/2',
      image: 'https://media.trakt.tv/images/seasons/posters/medium/a.jpg',
      seasonNumber: 2,
      numberOfEpisodes: 3,
      partOfSeries: { '@type': 'TVSeries', name: 'Severance', url: 'https://og.trakt.tv/shows/severance' },
    });
  });

  it('should leave out a season without episodes', () => {
    expect(toSeasonJsonLd({ ...season, episodes: [] })).not.toHaveProperty('numberOfEpisodes');
  });
});
