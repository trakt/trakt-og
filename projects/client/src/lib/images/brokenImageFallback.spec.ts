import { describe, expect, it } from 'vitest';
import { PLACEHOLDER_AVATAR } from '#lib/users/placeholderAvatar.ts';
import { brokenImageFallback } from './brokenImageFallback.ts';

const art = (path: string) => `https://media.trakt.tv/images/${path}`;

describe('brokenImageFallback', () => {
  it('should give an avatar the placeholder avatar', () => {
    expect(brokenImageFallback('https://media.trakt.tv/users/1/avatar.webp?v=1')).toBe(PLACEHOLDER_AVATAR);
  });

  it('should give a poster the poster placeholder', () => {
    expect(brokenImageFallback(art('movies/001/095/879/posters/thumb/34368524a8.jpg.webp'))).toContain('poster');
  });

  it('should give fanart and screenshots the fanart placeholder', () => {
    expect(brokenImageFallback(art('movies/001/381/607/fanarts/thumb/970b3e34fb.jpg.webp'))).toContain('fanart');
    expect(brokenImageFallback(art('episodes/011/002/003/screenshots/thumb/a.jpg.webp'))).toContain('fanart');
    expect(brokenImageFallback('https://media.trakt.tv/movies/851678/thumb/fanart.webp')).toContain('fanart');
    expect(brokenImageFallback('https://media.trakt.tv/movies/851678/thumb/poster.webp')).toContain('poster');
    expect(brokenImageFallback('https://media.trakt.tv/shows/1390/medium/thumb.webp')).toContain('fanart');
  });

  it('should give a headshot the person placeholder', () => {
    expect(brokenImageFallback('https://media.trakt.tv/people/1/thumb/headshot.webp')).toContain('person');
    expect(brokenImageFallback('https://media.trakt.tv/characters/1388-17419/thumb/headshot.webp')).toContain('person');
  });

  it("should hide a logo, from the image host or through og's logo route", () => {
    expect(brokenImageFallback(art('movies/001/381/607/logos/medium/a.png.webp'))).toBeNull();
    expect(brokenImageFallback('https://og.trakt.tv/api/logo/movies/001/381/607/logos/medium/a.png.webp')).toBeNull();
  });

  it('should leave placeholders and other hosts alone', () => {
    expect(brokenImageFallback(PLACEHOLDER_AVATAR)).toBeUndefined();
    expect(brokenImageFallback('https://image.tmdb.org/t/p/w500/posters/a.jpg')).toBeUndefined();
    expect(brokenImageFallback('not a url')).toBeUndefined();
  });
});
