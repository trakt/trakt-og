import { describe, expect, it } from 'vitest';
import { sitemapSchemaErrors } from './sitemapSchemaErrors.ts';

const urlset = (entries: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;

describe('test helper: sitemapSchemaErrors', () => {
  it('should pass a valid urlset', () => {
    expect(sitemapSchemaErrors(urlset('<url><loc>https://og.trakt.tv/a?b=1&amp;c=2</loc></url>'))).toEqual([]);
  });

  it('should fail an unescaped ampersand', () => {
    expect(sitemapSchemaErrors(urlset('<url><loc>https://og.trakt.tv/a?b=1&c=2</loc></url>'))).toHaveLength(1);
  });

  it('should fail unbalanced tags', () => {
    expect(sitemapSchemaErrors(urlset('<url><loc>https://og.trakt.tv/</url>'))).not.toEqual([]);
  });

  it('should fail a relative loc, a non-W3C lastmod and fields out of order', () => {
    expect(sitemapSchemaErrors(urlset('<url><loc>/movies</loc></url>'))).toHaveLength(1);
    expect(
      sitemapSchemaErrors(urlset('<url><loc>https://og.trakt.tv/</loc><lastmod>Oct 26</lastmod></url>')),
    ).toHaveLength(1);
    expect(
      sitemapSchemaErrors(urlset('<url><lastmod>2026-10-26</lastmod><loc>https://og.trakt.tv/</loc></url>')),
    ).toHaveLength(1);
  });

  it('should fail a missing namespace and an unknown root', () => {
    expect(sitemapSchemaErrors('<?xml version="1.0" encoding="UTF-8"?>\n<urlset></urlset>')).toHaveLength(1);
    expect(sitemapSchemaErrors('<?xml version="1.0" encoding="UTF-8"?>\n<feed></feed>')).toHaveLength(1);
  });

  it('should fail more than 50,000 entries', () => {
    expect(sitemapSchemaErrors(urlset('<url><loc>https://og.trakt.tv/</loc></url>'.repeat(50_001)))).toEqual([
      '50001 entries, over 50000',
    ]);
  });
});
