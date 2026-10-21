import { describe, expect, it } from 'vitest';
import { subpageApiPath } from './subpageApiPath.ts';

describe('subpageApiPath', () => {
  it("should build each item's API path from its route params", () => {
    expect(subpageApiPath({ type: 'movie', id: 'fight-club-1999' })).toBe('/movies/fight-club-1999');
    expect(subpageApiPath({ type: 'show', id: 'the-bear' })).toBe('/shows/the-bear');
    expect(subpageApiPath({ type: 'season', id: 'the-bear', season: '2' })).toBe('/shows/the-bear/seasons/2');
    expect(subpageApiPath({ type: 'episode', id: 'the-bear', season: '2', episode: '7' })).toBe(
      '/shows/the-bear/seasons/2/episodes/7',
    );
  });

  it('should escape the route params', () => {
    expect(subpageApiPath({ type: 'show', id: 'a/b' })).toBe('/shows/a%2Fb');
  });
});
