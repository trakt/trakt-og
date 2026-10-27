import { describe, expect, it } from 'vitest';
import type { Check } from './Check.ts';
import { checkSitemap } from './checkSitemap.ts';
import { parseSitemap } from './parseSitemap.ts';

const urlset = (entries: readonly string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`;

const url = (loc: string, lastmod?: string) =>
  `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;

const response = (body: string, headers: HeadersInit = {}) => ({
  status: 200,
  headers: new Headers({ 'content-type': 'application/xml', 'cache-control': 's-maxage=86400', ...headers }),
  body,
});

const failures = (checks: readonly Check[]) => checks.filter((check) => !check.pass).map((check) => check.label);

const movies = { hostKind: 'production', kind: 'urlset', includes: [], lastmod: true, maxUrls: 2 } as const;

describe('parseSitemap', () => {
  it('should read an index and unescape its locations', () => {
    const xml =
      '<sitemapindex><sitemap><loc>https://og.trakt.tv/sitemap/movies.xml?a=1&amp;b=2</loc></sitemap></sitemapindex>';

    expect(parseSitemap(xml)).toEqual({
      kind: 'index',
      entries: [{ loc: 'https://og.trakt.tv/sitemap/movies.xml?a=1&b=2' }],
    });
  });

  it('should read lastmod when a URL has one', () => {
    const xml = urlset([url('https://og.trakt.tv/movies/inception-2010', '2026-09-01'), url('https://og.trakt.tv/')]);

    expect(parseSitemap(xml).entries).toEqual([
      { loc: 'https://og.trakt.tv/movies/inception-2010', lastmod: '2026-09-01' },
      { loc: 'https://og.trakt.tv/' },
    ]);
  });
});

describe('checkSitemap', () => {
  it('should pass a cached URL set on og.trakt.tv with real lastmod dates', () => {
    const body = urlset([
      url('https://og.trakt.tv/movies/inception-2010', '2026-09-01T10:00:00Z'),
      url('https://og.trakt.tv/movies/the-dark-knight-2008', '2026-10-02'),
    ]);

    expect(failures(checkSitemap({ response: response(body), ...movies }))).toEqual([]);
  });

  it("should fail today's date stamped on every URL", () => {
    const body = urlset([
      url('https://og.trakt.tv/movies/inception-2010', '2026-10-26'),
      url('https://og.trakt.tv/movies/the-dark-knight-2008', '2026-10-26'),
    ]);

    expect(failures(checkSitemap({ response: response(body), ...movies }))).toEqual(['lastmod from updated_at']);
  });

  it('should fail other hosts, duplicates, missing lastmod and too many URLs', () => {
    const body = urlset([
      url('http://localhost:5173/movies/inception-2010'),
      url('https://og.trakt.tv/movies/up-2009', '2026-10-01'),
      url('https://og.trakt.tv/movies/up-2009', '2026-10-02'),
    ]);

    expect(failures(checkSitemap({ response: response(body), ...movies }))).toEqual([
      'at most 2 URLs',
      'URLs on https://og.trakt.tv',
      'no duplicate URLs',
      'lastmod on every URL',
    ]);
  });

  it('should fail an index that leaves out a sitemap', () => {
    const body = '<sitemapindex><sitemap><loc>https://og.trakt.tv/sitemap/pages.xml</loc></sitemap></sitemapindex>';
    const checks = checkSitemap({
      response: response(body),
      hostKind: 'production',
      kind: 'index',
      includes: ['/sitemap/pages.xml', '/sitemap/movies.xml'],
      lastmod: false,
      maxUrls: 50_000,
    });

    expect(failures(checks)).toEqual(['lists /sitemap/movies.xml']);
  });

  it('should want the noindex header and a day of caching on a preview host', () => {
    const body = urlset([url('https://og.trakt.tv/', '2026-10-01')]);
    const checks = checkSitemap({
      response: response(body, { 'cache-control': 'no-cache', 'content-type': 'text/html' }),
      ...movies,
      hostKind: 'preview',
    });

    expect(failures(checks)).toEqual(['XML', 'cached for a day', 'X-Robots-Tag noindex']);
  });
});
