import { describe, expect, it } from 'vitest';
import { proxiedLogoUrl } from './proxiedLogoUrl.ts';

describe('proxiedLogoUrl', () => {
  it('should send a show or movie logo through og', () => {
    expect(proxiedLogoUrl('https://media.trakt.tv/shows/1390/medium/logo.webp')).toBe(
      '/api/logo/shows/1390/medium/logo.webp',
    );
    expect(proxiedLogoUrl('https://media.trakt.tv/movies/1234/full/logo.webp')).toBe(
      '/api/logo/movies/1234/full/logo.webp',
    );
  });

  it('should leave any other image, and nothing, as it is', () => {
    const fanart = 'https://media.trakt.tv/shows/1390/medium/fanart.webp';

    expect(proxiedLogoUrl(fanart)).toBe(fanart);
    expect(proxiedLogoUrl('https://media.trakt.tv/people/1390/medium/logo.webp')).toBe(
      'https://media.trakt.tv/people/1390/medium/logo.webp',
    );
    expect(proxiedLogoUrl('https://example.com/shows/1390/medium/logo.webp')).toBe(
      'https://example.com/shows/1390/medium/logo.webp',
    );
    expect(proxiedLogoUrl(undefined)).toBeUndefined();
  });

  it('should not pass a path that climbs out of the images', () => {
    const climbing = 'https://media.trakt.tv/shows/1390/medium/../../../x/logo.webp';

    expect(proxiedLogoUrl(climbing)).toBe(climbing);
  });
});
