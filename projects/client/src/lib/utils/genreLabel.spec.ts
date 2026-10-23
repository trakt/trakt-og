import { describe, expect, it } from 'vitest';
import { genreLabel } from './genreLabel.ts';

describe('kind: unit', () => {
  describe('genreLabel', () => {
    it('should title-case every word of a slug', () => {
      expect(genreLabel('drama')).toBe('Drama');
      expect(genreLabel('science-fiction')).toBe('Science Fiction');
      expect(genreLabel('sporting-event')).toBe('Sporting Event');
    });

    it('should use the ampersand OG shows for home and garden', () => {
      expect(genreLabel('home-and-garden')).toBe('Home & Garden');
    });
  });
});
