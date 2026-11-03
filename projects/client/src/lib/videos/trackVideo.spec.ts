import { describe, expect, it } from 'vitest';
import { mediaSlug } from './trackVideo.ts';

describe('util: mediaSlug', () => {
  it('should read the movie or show slug', () => {
    expect(mediaSlug('/movies/tron-1982')).toBe('tron-1982');
    expect(mediaSlug('/shows/severance')).toBe('severance');
  });

  it("should read a season's or an episode's show", () => {
    expect(mediaSlug('/shows/severance/seasons/2')).toBe('severance');
    expect(mediaSlug('/shows/severance/seasons/2/episodes/1')).toBe('severance');
  });

  it('should ignore the origin and query', () => {
    expect(mediaSlug('https://og.trakt.tv/movies/tron-1982?share=Ab12Cd34Ef56')).toBe('tron-1982');
  });
});
