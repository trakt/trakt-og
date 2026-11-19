import { describe, expect, it } from 'vitest';
import { posterArt } from './posterArt.ts';

describe('posterArt', () => {
  it('should build the poster or fanart of the movie or show a list poster belongs to', () => {
    expect(posterArt('media.trakt.tv/images/movies/000/000/843/posters/medium/aec9f68dac.jpg.webp', 'fanart')).toBe(
      'https://media.trakt.tv/movies/843/thumb/fanart.webp',
    );
    expect(posterArt('https://media.trakt.tv/images/shows/000/154/997/posters/thumb/1a2b.jpg.webp', 'poster')).toBe(
      'https://media.trakt.tv/shows/154997/thumb/poster.webp',
    );
  });

  it("should read the API's short poster paths too", () => {
    expect(posterArt('media.trakt.tv/movies/66/medium/poster.webp', 'fanart')).toBe(
      'https://media.trakt.tv/movies/66/thumb/fanart.webp',
    );
    expect(posterArt('https://media.trakt.tv/shows/1390/thumb/poster.webp', 'poster')).toBe(
      'https://media.trakt.tv/shows/1390/thumb/poster.webp',
    );
  });

  it('should have none for a path it cannot read', () => {
    expect(posterArt('media.trakt.tv/images/lists/000/000/001/posters/medium/x.jpg', 'poster')).toBeUndefined();
    expect(posterArt(null, 'fanart')).toBeUndefined();
  });
});
