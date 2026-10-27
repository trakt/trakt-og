import { describe, expect, it } from 'vitest';
import { isBotAgent } from './isBotAgent.ts';

describe('util: isBotAgent', () => {
  it('should know search engines and link-preview bots, in any case', () => {
    expect(isBotAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    expect(isBotAgent('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true);
    expect(isBotAgent('Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)')).toBe(true);
    expect(isBotAgent('Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)')).toBe(true);
    expect(isBotAgent('facebookexternalhit/1.1')).toBe(true);
  });

  it('should not flag a browser or a missing user agent', () => {
    expect(isBotAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15')).toBe(
      false,
    );
    expect(isBotAgent('')).toBe(false);
    expect(isBotAgent(null)).toBe(false);
  });
});
