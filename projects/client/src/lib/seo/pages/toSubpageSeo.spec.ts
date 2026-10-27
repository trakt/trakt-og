import { describe, expect, it } from 'vitest';
import { toSubpageSeo } from './toSubpageSeo.ts';

describe('seo: toSubpageSeo', () => {
  it("should title the subpage after its title and use the title's art", () => {
    expect(
      toSubpageSeo({ title: 'Inception (2010)', subpage: 'People', image: 'https://media.trakt.tv/a.jpg' }),
    ).toEqual({
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
    const lines = subpages.map((subpage) => toSubpageSeo({ title: 'Severance (2022)', subpage }).description);

    expect(new Set(lines).size).toBe(subpages.length);
    expect(lines.every((line) => line?.includes('Severance (2022)'))).toBe(true);
  });

  it('should leave the image to the default without art', () => {
    expect(toSubpageSeo({ title: 'Severance (2022)', subpage: 'Stats' }).image).toBeUndefined();
  });
});
