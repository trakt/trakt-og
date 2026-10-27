import { describe, expect, it } from 'vitest';
import { toEpisodeJsonLd } from './toEpisodeJsonLd.ts';

const episode = {
  title: 'Half Loop',
  season: 1,
  episodeNumber: 2,
  href: '/shows/severance/seasons/1/episodes/2',
  seasonHref: '/shows/severance/seasons/1',
  showHref: '/shows/severance',
  showTitle: 'Severance',
  overview: 'Mark gets a visit.',
  screenshot: 'https://media.trakt.tv/images/episodes/screenshots/full/a.jpg.webp',
  fanart: 'https://media.trakt.tv/images/shows/fanarts/full/b.jpg.webp',
  runtime: 54,
  firstAired: '2022-02-18T02:00:00.000Z',
  rating: { value: 8.1, votes: 3000, href: '' },
};
const open = { title: false, overview: false, screenshot: false };

describe('seo: toEpisodeJsonLd', () => {
  it('should describe the episode as a schema.org TVEpisode of its season and series', () => {
    expect(toEpisodeJsonLd({ episode, spoilers: open })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'TVEpisode',
      name: 'Half Loop',
      description: 'Mark gets a visit.',
      url: 'https://og.trakt.tv/shows/severance/seasons/1/episodes/2',
      image: 'https://media.trakt.tv/images/episodes/screenshots/full/a.jpg',
      episodeNumber: 2,
      datePublished: '2022-02-18',
      duration: 'PT54M',
      partOfSeason: { '@type': 'TVSeason', seasonNumber: 1, url: 'https://og.trakt.tv/shows/severance/seasons/1' },
      partOfSeries: { '@type': 'TVSeries', name: 'Severance', url: 'https://og.trakt.tv/shows/severance' },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 8.1,
        bestRating: 10,
        worstRating: 1,
        ratingCount: 3000,
      },
    });
  });

  describe('for hidden spoilers', () => {
    it('should leave the title, overview and screenshot out', () => {
      const data = toEpisodeJsonLd({ episode, spoilers: { title: true, overview: true, screenshot: true } });

      expect(data.name).toBe('Episode 2');
      expect(data).not.toHaveProperty('description');
      expect(data.image).toBe('https://media.trakt.tv/images/shows/fanarts/full/b.jpg');
    });
  });
});
