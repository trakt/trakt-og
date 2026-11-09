import { describe, expect, it } from 'vitest';
import { isScreenshotUrl } from './isScreenshotUrl.ts';

describe('util: isScreenshotUrl', () => {
  it('should spot an episode screenshot', () => {
    expect(isScreenshotUrl('https://media.trakt.tv/episodes/14554539/thumb/screenshot.webp')).toBe(true);
    expect(
      isScreenshotUrl('https://media.trakt.tv/images/episodes/000/073/482/screenshots/medium/ef3352bcb8.jpg.webp'),
    ).toBe(true);
  });

  it('should not spot other art, or nothing', () => {
    expect(isScreenshotUrl('https://media.trakt.tv/shows/1390/medium/fanart.webp')).toBe(false);
    expect(isScreenshotUrl('https://media.trakt.tv/shows/1390/medium/thumb.webp')).toBe(false);
    expect(isScreenshotUrl(undefined)).toBe(false);
  });
});
