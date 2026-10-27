import { describe, expect, it } from 'vitest';
import { sitemapSchemaErrors } from '../../test/sitemapSchemaErrors.ts';
import { buildSitemapIndex } from './buildSitemapIndex.ts';

describe('util: buildSitemapIndex', () => {
  it('should list each sitemap file as an absolute URL', () => {
    const xml = buildSitemapIndex({ origin: 'https://og.trakt.tv', paths: ['/sitemap/pages.xml', '/sitemap/a&b.xml'] });

    expect(sitemapSchemaErrors(xml)).toEqual([]);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://og.trakt.tv/sitemap/pages.xml</loc>');
    expect(xml).toContain('<loc>https://og.trakt.tv/sitemap/a&amp;b.xml</loc>');
  });
});
