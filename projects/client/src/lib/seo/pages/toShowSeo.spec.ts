import { describe, expect, it } from 'vitest';
import { toShowSeo } from './toShowSeo.ts';

const show = {
  fullTitle: 'Severance (2022)',
  overview: 'Mark leads a team of office workers.',
  fanart: 'https://media.trakt.tv/images/shows/fanarts/full/a.jpg.webp',
  poster: 'https://media.trakt.tv/images/shows/posters/medium/b.jpg.webp',
};

describe('seo: toShowSeo', () => {
  it('should title the show with its year and describe it with its overview and fanart', () => {
    expect(toShowSeo(show)).toEqual({
      title: 'Severance (2022)',
      description: 'Mark leads a team of office workers.',
      image: show.fanart,
      imageAlt: 'Severance (2022)',
      type: 'video.tv_show',
    });
  });

  it('should fall back to a fixed line without an overview', () => {
    expect(toShowSeo({ ...show, overview: null }).description).toBe(
      'Where to watch Severance (2022), its seasons, ratings, comments and lists on Trakt.',
    );
  });

  it('should fall back to the poster, then the default image, without fanart', () => {
    expect(toShowSeo({ ...show, fanart: undefined }).image).toBe(show.poster);
    expect(toShowSeo({ ...show, fanart: undefined, poster: undefined }).image).toBeUndefined();
  });
});
