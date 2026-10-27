import { describe, expect, it } from 'vitest';
import { toSubpageSeo } from './toSubpageSeo.ts';

const movie = { title: 'Inception (2010)', href: '/movies/inception-2010' };

describe('seo: toSubpageSeo', () => {
  it("should title the subpage after its title and use the title's art", () => {
    expect(toSubpageSeo({ ...movie, subpage: 'People', image: 'https://media.trakt.tv/a.jpg' })).toMatchObject({
      title: 'Inception (2010): People',
      description: 'The cast and crew of Inception (2010).',
      image: 'https://media.trakt.tv/a.jpg',
      imageAlt: 'Inception (2010)',
    });
  });

  it('should give each subpage its own fixed line', () => {
    const subpages = [
      'People',
      'Stats',
      'Lists',
      'Videos',
      'Release Dates',
      'Comments',
      'Seasons',
      'Episodes',
    ] as const;
    const lines = subpages.map(
      (subpage) => toSubpageSeo({ title: 'Severance (2022)', href: '/shows/severance', subpage }).description,
    );

    expect(new Set(lines).size).toBe(subpages.length);
    expect(lines.every((line) => line?.includes('Severance (2022)'))).toBe(true);
  });

  it('should leave the image to the default without art', () => {
    expect(toSubpageSeo({ ...movie, subpage: 'Stats' }).image).toBeUndefined();
  });

  it('should end the trail on the subpage, under its title', () => {
    const seo = toSubpageSeo({
      title: 'Season 1',
      href: '/shows/severance/seasons/1',
      parents: [{ title: 'Severance', href: '/shows/severance' }],
      subpage: 'Comments',
    });

    expect(seo.jsonLd).toMatchObject([
      {
        '@type': 'BreadcrumbList',
        itemListElement: [{ name: 'Shows' }, { name: 'Severance' }, { name: 'Season 1' }, { name: 'Comments' }],
      },
    ]);
  });
});
