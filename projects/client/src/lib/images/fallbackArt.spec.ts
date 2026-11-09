import { describe, expect, it } from 'vitest';
import { fallbackArt } from './fallbackArt.ts';
import { mediaImage } from './mediaImage.ts';

describe('util: fallbackArt', () => {
  it('should read the fallback mediaImage put in the URL', () => {
    const show = mediaImage({ type: 'show', id: 2, slot: 'fanart', size: 'thumb' });
    const episode = mediaImage({ type: 'episode', id: 9, slot: 'screenshot', size: 'thumb', fallback: show });

    expect(fallbackArt(episode)).toBe(show);
  });

  it("should try a landscape thumb's fanart at the same size", () => {
    expect(fallbackArt('https://media.trakt.tv/shows/2/medium/thumb.webp')).toBe(
      'https://media.trakt.tv/shows/2/medium/fanart.webp',
    );
  });

  it('should find none in a URL without one', () => {
    expect(fallbackArt('https://media.trakt.tv/shows/2/thumb/fanart.webp')).toBeUndefined();
    expect(fallbackArt('https://media.trakt.tv/shows/2/thumb/fanart.webp#other')).toBeUndefined();
    expect(fallbackArt('not a url')).toBeUndefined();
  });
});
