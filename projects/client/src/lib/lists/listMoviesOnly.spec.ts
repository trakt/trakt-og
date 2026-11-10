import { describe, expect, it } from 'vitest';
import { listMoviesOnly, posterItemType } from './listMoviesOnly.ts';

describe('posterItemType', () => {
  it('should read the type from the poster folder', () => {
    expect(posterItemType('media.trakt.tv/images/shows/000/001/388/posters/medium/a.jpg.webp')).toBe('show');
    expect(posterItemType('media.trakt.tv/images/movies/000/000/120/posters/medium/b.jpg.webp')).toBe('movie');
    expect(posterItemType('media.trakt.tv/images/seasons/000/003/001/posters/medium/c.jpg.webp')).toBe('season');
  });

  it('should leave an unknown path untyped', () => {
    expect(posterItemType('media.trakt.tv/images/a/posters/medium/1.jpg.webp')).toBeUndefined();
  });
});

describe('listMoviesOnly', () => {
  it('should know a list is movies only once its first items cover it', () => {
    expect(listMoviesOnly(3, ['movie', 'movie', 'season'])).toBe(true);
  });

  it('should send a list with a show, an empty list or one with no movies to show progress', () => {
    expect(listMoviesOnly(2, ['movie', 'show'])).toBe(false);
    expect(listMoviesOnly(0, [])).toBe(false);
    expect(listMoviesOnly(1, ['episode'])).toBe(false);
  });

  it('should not guess while some items are unseen or untyped', () => {
    expect(listMoviesOnly(38, ['movie', 'movie', 'movie', 'movie', 'movie'])).toBe(false);
    expect(listMoviesOnly(2, ['movie', undefined])).toBe(false);
  });
});
