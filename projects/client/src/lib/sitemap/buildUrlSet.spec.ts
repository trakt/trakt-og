import { describe, expect, it } from 'vitest';
import { sitemapSchemaErrors } from '../../test/sitemapSchemaErrors.ts';
import { buildUrlSet } from './buildUrlSet.ts';

const origin = 'https://og.trakt.tv';

describe('util: buildUrlSet', () => {
  it('should list absolute URLs, with a lastmod only where there is one', () => {
    const xml = buildUrlSet({
      origin,
      urls: [{ path: '/movies/tron-1982', lastmod: '2026-10-26T08:05:55Z' }, { path: '/about' }],
    });

    expect(sitemapSchemaErrors(xml)).toEqual([]);
    expect(xml).toContain(
      '<url>\n    <loc>https://og.trakt.tv/movies/tron-1982</loc>\n    <lastmod>2026-10-26T08:05:55Z</lastmod>\n  </url>',
    );
    expect(xml).toContain('<url>\n    <loc>https://og.trakt.tv/about</loc>\n  </url>');
  });

  it('should escape special characters in a URL', () => {
    const xml = buildUrlSet({ origin, urls: [{ path: `/users/a&b/lists/<it's>` }] });

    expect(sitemapSchemaErrors(xml)).toEqual([]);
    expect(xml).toContain('<loc>https://og.trakt.tv/users/a&amp;b/lists/&lt;it&apos;s&gt;</loc>');
  });

  it('should stay a valid sitemap with no URLs', () => {
    expect(sitemapSchemaErrors(buildUrlSet({ origin, urls: [] }))).toEqual([]);
  });

  it("should stop at the protocol's 50,000 URLs", () => {
    const urls = Array.from({ length: 50_001 }, (_, i) => ({ path: `/movies/${i}` }));
    const xml = buildUrlSet({ origin, urls });

    expect(sitemapSchemaErrors(xml)).toEqual([]);
    expect(xml.match(/<url>/g)).toHaveLength(50_000);
    expect(xml).not.toContain('/movies/50000<');
  });
});
