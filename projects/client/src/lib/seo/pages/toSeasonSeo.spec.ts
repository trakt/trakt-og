import { describe, expect, it } from 'vitest';
import { toSeasonSeo } from './toSeasonSeo.ts';

const season = {
  fullTitle: 'Severance: Season 2',
  overview: 'Mark and his team return.',
  seasonPoster: 'https://media.trakt.tv/images/seasons/posters/medium/a.jpg.webp',
  fanart: 'https://media.trakt.tv/images/shows/fanarts/full/b.jpg.webp',
};

describe('seo: toSeasonSeo', () => {
  it('should title the season under its show and use its poster', () => {
    expect(toSeasonSeo(season)).toEqual({
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
});
