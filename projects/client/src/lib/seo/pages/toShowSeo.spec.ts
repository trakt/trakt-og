import { describe, expect, it } from 'vitest';
import { toShowSeo } from './toShowSeo.ts';

const show = {
  title: 'Severance',
  fullTitle: 'Severance (2022)',
  href: '/shows/severance',
  overview: 'Mark leads a team of office workers.',
  preview: 'https://og.trakt.tv/api/art/show/1/fanart/show/1/poster',
  structuredImage: 'https://og.trakt.tv/api/art/show/1/poster/show/1/fanart',
  certification: 'TV-MA',
  rating: undefined,
  links: [],
  firstAired: '2022-02-18T02:00:00.000Z',
  airedEpisodes: 19,
  facts: { genres: [] },
};

describe('seo: toShowSeo', () => {
  it('should title the show with its year and describe it with its overview and fanart', () => {
    expect(toShowSeo(show)).toMatchObject({
      title: 'Severance (2022)',
      description: 'Mark leads a team of office workers.',
      image: show.preview,
      imageAlt: 'Severance (2022)',
      type: 'video.tv_show',
    });
  });

  it('should fall back to a fixed line without an overview', () => {
    expect(toShowSeo({ ...show, overview: null }).description).toBe(
      'Where to watch Severance (2022), its seasons, ratings, comments and lists on Trakt.',
    );
  });

  it('should add the TVSeries and its trail from Shows', () => {
    const [data, trail] = toShowSeo(show).jsonLd ?? [];

    expect(data).toMatchObject({ '@type': 'TVSeries', name: 'Severance', startDate: '2022-02-18' });
    expect(trail).toMatchObject({ itemListElement: [{ name: 'Shows' }, { name: 'Severance (2022)' }] });
  });
});
