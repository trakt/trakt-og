import { describe, expect, it } from 'vitest';
import { networkSlug } from './networkSlug.ts';

describe('kind: unit', () => {
  describe('networkSlug', () => {
    it('should turn a plus into -plus', () => {
      expect(networkSlug('Apple TV+')).toBe('Apple TV-plus');
    });

    it('should leave other networks alone', () => {
      expect(networkSlug('Prime Video')).toBe('Prime Video');
    });
  });
});
