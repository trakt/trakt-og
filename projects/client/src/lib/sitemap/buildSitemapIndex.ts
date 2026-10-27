import { escapeXml } from './escapeXml.ts';

type BuildSitemapIndexParams = {
  origin: string;
  paths: readonly string[];
};

/**
 * A `<sitemapindex>` of og's sitemap files. It has no `lastmod`: each file's date would mean reading the API for it,
 * and a made-up one is ignored by search engines.
 */
export function buildSitemapIndex({ origin, paths }: BuildSitemapIndexParams): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((path) => `  <sitemap>\n    <loc>${escapeXml(`${origin}${path}`)}</loc>\n  </sitemap>`),
    '</sitemapindex>',
    '',
  ].join('\n');
}
