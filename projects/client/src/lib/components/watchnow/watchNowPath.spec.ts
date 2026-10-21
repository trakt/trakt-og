import { describe, expect, it } from 'vitest';
import { watchNowPath } from './watchNowPath.ts';

describe('watchNowPath', () => {
  it('should use the Trakt id for movies and shows', () => {
    expect(watchNowPath({ type: 'movie', id: 1 })).toBe('/movies/1');
    expect(watchNowPath({ type: 'show', id: 2 })).toBe('/shows/2');
  });

  it('should nest seasons and episodes under their show', () => {
    expect(watchNowPath({ type: 'season', id: 3, season: { show: 2, number: 1 } })).toBe('/shows/2/seasons/1');
    expect(watchNowPath({ type: 'episode', id: 4, season: { show: 2, number: 1, episode: 5 } }))
      .toBe('/shows/2/seasons/1/episodes/5');
  });

  it('should have no path for a season or episode without its show', () => {
    expect(watchNowPath({ type: 'episode', id: 4 })).toBeUndefined();
    expect(watchNowPath({ type: 'episode', id: 4, season: { show: 2, number: 1 } })).toBeUndefined();
  });
});
