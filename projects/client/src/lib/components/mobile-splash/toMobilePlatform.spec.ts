import { describe, expect, it } from 'vitest';
import { toMobilePlatform } from './toMobilePlatform.ts';

describe('util: toMobilePlatform', () => {
  it('should read Android from an Android user agent', () => {
    const userAgent =
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';
    expect(toMobilePlatform(userAgent)).toBe('android');
  });

  it('should read iOS from an iPhone user agent', () => {
    const userAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
    expect(toMobilePlatform(userAgent)).toBe('ios');
  });

  it('should read iOS from an iPad that reports itself as a Mac', () => {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';
    expect(toMobilePlatform(userAgent)).toBe('ios');
  });

  it('should fall back to iOS without a user agent', () => {
    expect(toMobilePlatform(null)).toBe('ios');
  });
});
