import { describe, expect, it } from 'vitest';
import { usesImperial } from './usesImperial.ts';

describe('util: usesImperial', () => {
  it('should use imperial for the first language region that does', () => {
    expect(usesImperial('en-US,en;q=0.9')).toBe(true);
    expect(usesImperial('en-us')).toBe(true);
    expect(usesImperial('en-GB,en-US;q=0.9')).toBe(false);
    expect(usesImperial('zh-Hant-TW')).toBe(false);
  });

  it('should use metric without a region', () => {
    expect(usesImperial('en')).toBe(false);
    expect(usesImperial('')).toBe(false);
    expect(usesImperial(null)).toBe(false);
  });
});
