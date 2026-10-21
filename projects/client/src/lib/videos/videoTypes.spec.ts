import { describe, expect, it } from 'vitest';
import { readVideoTab, videosHref, videoTabSlug } from './videoTypes.ts';

describe('videoTypes', () => {
  describe('videoTabSlug', () => {
    it('should hyphenate the types with spaces', () => {
      expect(videoTabSlug('behind the scenes')).toBe('behind-the-scenes');
      expect(videoTabSlug('trailer')).toBe('trailer');
    });
  });

  describe('readVideoTab', () => {
    it('should read a type or All from the link', () => {
      expect(readVideoTab(new URLSearchParams('type=behind-the-scenes'))).toBe('behind the scenes');
      expect(readVideoTab(new URLSearchParams('type=all'))).toBe('all');
    });

    it('should ignore a missing or unknown type', () => {
      expect(readVideoTab(new URLSearchParams())).toBeUndefined();
      expect(readVideoTab(new URLSearchParams('type=bonus'))).toBeUndefined();
    });
  });

  describe('videosHref', () => {
    it('should keep the default choice bare', () => {
      expect(videosHref('/shows/visionquest')).toBe('/shows/visionquest/videos');
    });

    it('should name any other choice', () => {
      expect(videosHref('/movies/fight-club-1999', 'opening credits')).toBe(
        '/movies/fight-club-1999/videos?type=opening-credits',
      );
      expect(videosHref('/shows/visionquest', 'all')).toBe('/shows/visionquest/videos?type=all');
    });
  });
});
