import { describe, expect, it } from 'vitest';
import { detectCrawler } from './detectCrawler.ts';

const BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';

describe('util: detectCrawler', () => {
  it('should trust only a crawler Cloudflare verified', () => {
    expect(detectCrawler({ userAgent: BROWSER, verifiedBotCategory: 'Search Engine Crawler' })).toEqual({
      verified: true,
      bot: true,
    });
    expect(detectCrawler({ userAgent: 'Googlebot/2.1', verifiedBotCategory: undefined })).toEqual({
      verified: false,
      bot: true,
    });
  });

  it("should count Cloudflare's verified page previews as bots", () => {
    expect(detectCrawler({ userAgent: BROWSER, verifiedBotCategory: 'Page Preview' })).toEqual({
      verified: false,
      bot: true,
    });
  });

  it('should not flag a browser', () => {
    expect(detectCrawler({ userAgent: BROWSER, verifiedBotCategory: undefined })).toEqual({
      verified: false,
      bot: false,
    });
    expect(detectCrawler({ userAgent: null, verifiedBotCategory: 'Monitoring & Analytics' })).toEqual({
      verified: false,
      bot: false,
    });
  });
});
