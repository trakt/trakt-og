import { describe, expect, it } from 'vitest';
import { isPhoneUserAgent } from './isPhoneUserAgent.ts';

describe('util: isPhoneUserAgent', () => {
  it('should match an iPhone', () => {
    const userAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
    expect(isPhoneUserAgent(userAgent)).toBe(true);
  });

  it('should match an Android phone', () => {
    const userAgent =
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';
    expect(isPhoneUserAgent(userAgent)).toBe(true);
  });

  it('should match Googlebot Smartphone, which gets the same page as a phone', () => {
    const userAgent =
      'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    expect(isPhoneUserAgent(userAgent)).toBe(true);
  });

  it('should not match an Android tablet', () => {
    const userAgent =
      'Mozilla/5.0 (Linux; Android 15; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
    expect(isPhoneUserAgent(userAgent)).toBe(false);
  });

  it('should not match a Mac', () => {
    const userAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';
    expect(isPhoneUserAgent(userAgent)).toBe(false);
  });

  it('should not match without a user agent', () => {
    expect(isPhoneUserAgent(null)).toBe(false);
  });
});
