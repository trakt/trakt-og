import { describe, expect, it } from 'vitest';
import { toSeasonSeo } from './toSeasonSeo.ts';

const season = {
  title: 'Season 2',
  fullTitle: 'Severance: Season 2',
  number: 2,
  href: '/shows/severance/seasons/2',
  overview: 'Mark and his team return.',
  poster: 'https://media.trakt.tv/images/seasons/posters/medium/a.jpg.webp',
  seasonPoster: 'https://media.trakt.tv/images/seasons/posters/medium/a.jpg.webp',
  fanart: 'https://media.trakt.tv/images/shows/fanarts/full/b.jpg.webp',
  rating: undefined,
  showTitle: 'Severance',
  showHref: '/shows/severance',
  parents: [{ title: 'Severance', href: '/shows/severance' }],
  episodes: [{}, {}],
};

describe('seo: toSeasonSeo', () => {
  it('should title the season under its show and use its poster', () => {
    expect(toSeasonSeo(season)).toMatchObject({
      title: 'Severance: Season 2',
      description: 'Mark and his team return.',
      image: season.seasonPoster,
      imageAlt: 'Severance: Season 2',
      type: 'video.tv_show',
    });
  });

  it('should fall back to a fixed line without any overview', () => {
    expect(toSeasonSeo({ ...season, overview: null }).description).toBe(
      'Every episode of Severance: Season 2, with ratings, comments and lists on Trakt.',
    );
  });

  it("should fall back to the show's fanart without a poster of its own", () => {
    expect(toSeasonSeo({ ...season, seasonPoster: undefined }).image).toBe(season.fanart);
  });

  it('should add the TVSeason and its trail through the show', () => {
    const [data, trail] = toSeasonSeo(season).jsonLd ?? [];

    expect(data).toMatchObject({ '@type': 'TVSeason', seasonNumber: 2, numberOfEpisodes: 2 });
    expect(trail).toMatchObject({ itemListElement: [{ name: 'Shows' }, { name: 'Severance' }, { name: 'Season 2' }] });
  });
});
