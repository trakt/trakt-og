import { escapeXml } from './escapeXml.ts';
import type { SitemapUrl } from './SitemapUrl.ts';

/** The protocol's cap on URLs in one sitemap file. */
const MAX_SITEMAP_URLS = 50_000;

type BuildUrlSetParams = {
  origin: string;
  urls: readonly SitemapUrl[];
};

const toEntry = (origin: string, { path, lastmod }: SitemapUrl) =>
  [
    '  <url>',
    `    <loc>${escapeXml(`${origin}${path}`)}</loc>`,
    ...(lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : []),
    '  </url>',
  ].join('\n');

/** A sitemap `<urlset>` of absolute URLs on `origin`, cut at the protocol's 50,000. */
export function buildUrlSet({ origin, urls }: BuildUrlSetParams): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.slice(0, MAX_SITEMAP_URLS).map((url) => toEntry(origin, url)),
    '</urlset>',
    '',
  ].join('\n');
}
