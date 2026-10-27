import { describe, expect, it } from 'vitest';
import { toShareImageUrl } from './toShareImageUrl.ts';

describe('seo: toShareImageUrl', () => {
  it('should drop the .webp from a .jpg.webp copy', () => {
    expect(toShareImageUrl('https://media.trakt.tv/images/movies/000/001/fanarts/full/abc.jpg.webp')).toBe(
      'https://media.trakt.tv/images/movies/000/001/fanarts/full/abc.jpg',
    );
  });

  it('should keep any other URL as it is', () => {
    expect(toShareImageUrl('https://media.trakt.tv/images/movies/abc.jpg')).toBe(
      'https://media.trakt.tv/images/movies/abc.jpg',
    );
    expect(toShareImageUrl('https://example.com/a.webp')).toBe('https://example.com/a.webp');
  });
});
