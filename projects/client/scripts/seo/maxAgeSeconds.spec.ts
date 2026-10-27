import { describe, expect, it } from 'vitest';
import { maxAgeSeconds } from './maxAgeSeconds.ts';

describe('maxAgeSeconds', () => {
  it('should read the longest of max-age and s-maxage', () => {
    expect(maxAgeSeconds('public, max-age=3600, s-maxage=86400')).toBe(86_400);
  });

  it('should be 0 without a cache header or an age', () => {
    expect(maxAgeSeconds(null)).toBe(0);
    expect(maxAgeSeconds('no-store')).toBe(0);
  });
});
