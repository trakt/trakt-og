import { describe, expect, it } from 'vitest';
import { mediaSpoilers } from './mediaSpoilers.ts';

describe('mediaSpoilers', () => {
  it('should protect every requested episode field before watched state is known', () => {
    expect(mediaSpoilers({ type: 'episode', spoilers: { episodes: 'hide' } })).toEqual({
      title: true,
      overview: true,
      screenshot: true,
    });
  });
  it.each([
    ['hide_overviews', false, true, false],
    ['hide_screenshots_overviews', false, true, true],
    ['show', false, false, false],
  ])('should honor the episode mode %s', (mode, title, overview, screenshot) => {
    expect(mediaSpoilers({ type: 'episode', spoilers: { episodes: mode }, watched: false })).toEqual({
      title,
      overview,
      screenshot,
    });
  });
  it.each(['movie', 'show', 'season'] as const)('should hide only the overview on an unwatched %s', (type) => {
    expect(mediaSpoilers({ type, spoilers: { movies: 'hide', shows: 'hide' }, watched: false })).toEqual({
      title: false,
      overview: true,
      screenshot: false,
    });
  });
  it.each(['movie', 'show', 'season', 'episode'] as const)('should reveal watched %s items', (type) => {
    expect(
      mediaSpoilers({
        type,
        spoilers: { episodes: 'hide', movies: 'hide', shows: 'hide' },
        watched: true,
      }),
    ).toEqual({ title: false, overview: false, screenshot: false });
  });
  it('should leave logged-out preferences and people unprotected', () => {
    expect(Object.values(mediaSpoilers({ type: 'episode' })).every((hidden) => !hidden)).toBe(true);
    expect(
      Object.values(mediaSpoilers({ type: 'person', spoilers: { shows: 'hide' } })).every((hidden) => !hidden),
    ).toBe(true);
  });
});
