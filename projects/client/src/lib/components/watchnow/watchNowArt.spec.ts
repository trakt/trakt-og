import { describe, expect, it } from 'vitest';
import { watchNowArt } from './watchNowArt.ts';

describe('watchNowArt', () => {
  it("should build a season's or episode's art from its show's id", () => {
    expect(watchNowArt('/shows/1388/seasons/1/episodes/1')).toBe(
      'https://media.trakt.tv/shows/1388/medium/fanart.webp',
    );
  });

  it("should build a movie's art from its id", () => {
    expect(watchNowArt('/movies/12')).toBe('https://media.trakt.tv/movies/12/medium/fanart.webp');
  });

  it('should have no art for a path with a slug', () => {
    expect(watchNowArt('/movies/fight-club-1999')).toBeUndefined();
  });
});
