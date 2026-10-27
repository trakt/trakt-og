import { describe, expect, it } from 'vitest';
import { toTitleCrumbs } from './toTitleCrumbs.ts';

describe('seo: toTitleCrumbs', () => {
  it("should start with the title's section and skip parents without a link", () => {
    expect(
      toTitleCrumbs({
        title: 'Season 10',
        href: '/shows/severance/seasons/10',
        parents: [{ title: 'Severance', href: '/shows/severance' }, { title: 'Season 10' }],
      }),
    ).toEqual([
      { name: 'Shows', path: '/shows/trending' },
      { name: 'Severance', path: '/shows/severance' },
      { name: 'Season 10', path: '/shows/severance/seasons/10' },
    ]);
  });

  it('should start a movie at Movies and a person at themselves', () => {
    expect(toTitleCrumbs({ title: 'Inception (2010)', href: '/movies/inception-2010' }).at(0)?.name).toBe('Movies');
    expect(toTitleCrumbs({ title: 'Adam Scott', href: '/people/adam-scott' })).toEqual([
      { name: 'Adam Scott', path: '/people/adam-scott' },
    ]);
  });
});
