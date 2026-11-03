import { describe, expect, it } from 'vitest';
import { toDrilldownTarget } from './toDrilldownTarget.ts';

describe('util: toDrilldownTarget', () => {
  it.each([
    ['/movies/dune-part-two-2024', 'movie'],
    ['/shows/severance', 'show'],
    ['/shows/severance/seasons/2', 'season'],
    ['/shows/severance/seasons/2/episodes/3', 'episode'],
    ['/people/zendaya', 'person'],
    ['/movies/dune-part-two-2024?ref=x#cast', 'movie'],
    ['/shows/severance/', 'show'],
    ['https://og.trakt.tv/movies/dune-part-two-2024', 'movie'],
  ])('should open %s as a %s summary', (href, type) => {
    expect(toDrilldownTarget(href)).toEqual({ event: 'summary', type });
  });

  it.each(['/users/sean/lists/favorites-2026', '/lists/official/star-wars', '/lists/12345'])(
    'should open %s as a list',
    (href) => {
      expect(toDrilldownTarget(href)).toEqual({ event: 'list' });
    },
  );

  it.each([
    '/movies/trending',
    '/shows/popular/weekly',
    '/movies/boxoffice',
    '/shows/watched',
    '/movies/dune-part-two-2024/comments',
    '/shows/severance/seasons/2/episodes/3/stats',
    '/users/sean',
    '/users/sean/lists',
    '/',
    'https://www.imdb.com/title/tt15239678',
    'https://app.trakt.tv/movies/dune-part-two-2024',
  ])('should not count %s', (href) => {
    expect(toDrilldownTarget(href)).toBeNull();
  });
});
