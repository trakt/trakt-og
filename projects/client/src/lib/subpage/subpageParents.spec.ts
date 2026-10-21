import { describe, expect, it } from 'vitest';
import { subpageParents } from './subpageParents.ts';

const show = { title: 'Ted Lasso', href: '/shows/ted-lasso' };
const season = { title: 'Season 1', href: '/shows/ted-lasso/seasons/1' };

describe('subpageParents', () => {
  it("should keep an episode's show and season on the same subpage", () => {
    expect(subpageParents({ type: 'episode', parents: [show, season], suffix: 'comments' })).toEqual([
      { title: 'Ted Lasso', href: '/shows/ted-lasso/comments' },
      { title: 'Season 1', href: '/shows/ted-lasso/seasons/1/comments' },
    ]);
  });

  it("should keep a titled season's name on the same subpage as its number", () => {
    const name = { title: 'Delicate', href: '/shows/ted-lasso/seasons/1' };
    expect(subpageParents({ type: 'episode', parents: [show, season, name], suffix: 'people' }).at(2)?.href).toBe(
      '/shows/ted-lasso/seasons/1/people',
    );
  });

  it("should step an episode's videos up to the season's videos", () => {
    expect(subpageParents({ type: 'episode', parents: [show, season], suffix: 'videos' }).at(1)?.href).toBe(
      '/shows/ted-lasso/seasons/1/videos',
    );
  });

  it("should keep a season's show on the same subpage", () => {
    expect(subpageParents({ type: 'season', parents: [show], suffix: 'stats' }).at(0)?.href).toBe(
      '/shows/ted-lasso/stats',
    );
  });

  it('should send the season to itself where seasons have no such subpage', () => {
    expect(subpageParents({ type: 'episode', parents: [show, season], suffix: 'lists' })).toEqual([
      { title: 'Ted Lasso', href: '/shows/ted-lasso/lists' },
      season,
    ]);
  });

  it("should leave a movie's collection linking to the list", () => {
    const collection = { title: 'TRON Collection', href: '/lists/official/tron-collection' };
    expect(subpageParents({ type: 'movie', parents: [collection], suffix: 'stats' })).toEqual([collection]);
  });
});
