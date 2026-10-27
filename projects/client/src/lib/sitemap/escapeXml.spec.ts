import { describe, expect, it } from 'vitest';
import { escapeXml } from './escapeXml.ts';

describe('util: escapeXml', () => {
  it("should escape XML's five special characters", () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f');
  });

  it('should escape an existing entity again, since the text is raw', () => {
    expect(escapeXml('&amp;')).toBe('&amp;amp;');
  });

  it('should leave plain text alone', () => {
    expect(escapeXml('https://og.trakt.tv/movies/tron-1982')).toBe('https://og.trakt.tv/movies/tron-1982');
  });
});
