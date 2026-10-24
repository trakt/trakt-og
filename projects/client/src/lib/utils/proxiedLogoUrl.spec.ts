import { describe, expect, it } from 'vitest';
import { proxiedLogoUrl } from './proxiedLogoUrl.ts';

describe('proxiedLogoUrl', () => {
  it('should send a show or movie logo through og', () => {
    expect(proxiedLogoUrl('https://media.trakt.tv/images/shows/000/155/534/logos/medium/b75c2b6193.png.webp')).toBe(
      '/api/logo/shows/000/155/534/logos/medium/b75c2b6193.png.webp',
    );
    expect(proxiedLogoUrl('https://media.trakt.tv/images/movies/000/001/234/logos/medium/abc.png.webp')).toBe(
      '/api/logo/movies/000/001/234/logos/medium/abc.png.webp',
    );
  });

  it('should leave any other image, and nothing, as it is', () => {
    const fanart = 'https://media.trakt.tv/images/shows/000/155/534/fanarts/medium/d5270246b5.jpg.webp';

    expect(proxiedLogoUrl(fanart)).toBe(fanart);
    expect(proxiedLogoUrl('https://example.com/shows/000/155/534/logos/medium/x.png.webp')).toBe(
      'https://example.com/shows/000/155/534/logos/medium/x.png.webp',
    );
    expect(proxiedLogoUrl(undefined)).toBeUndefined();
  });

  it('should not pass a path that climbs out of the images', () => {
    const climbing = 'https://media.trakt.tv/images/shows/000/155/534/logos/medium/../../../../x.png.webp';

    expect(proxiedLogoUrl(climbing)).toBe(climbing);
  });
});
