import { describe, expect, it } from 'vitest';
import { verifiedBotCategory } from './verifiedBotCategory.ts';

const withCf = (cf: unknown) => Object.assign(new Request('https://og.trakt.tv/'), { cf });

describe('util: verifiedBotCategory', () => {
  it("should read Cloudflare's verified bot category", () => {
    expect(verifiedBotCategory(withCf({ verifiedBotCategory: 'Search Engine Crawler' }))).toBe('Search Engine Crawler');
  });

  it('should be unset outside Cloudflare or for an unverified request', () => {
    expect(verifiedBotCategory(new Request('https://og.trakt.tv/'))).toBeUndefined();
    expect(verifiedBotCategory(withCf({ verifiedBotCategory: '' }))).toBe('');
    expect(verifiedBotCategory(withCf({}))).toBeUndefined();
  });
});
