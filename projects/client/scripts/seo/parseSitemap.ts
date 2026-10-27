import type { Sitemap } from './Sitemap.ts';

const XML_ENTITIES: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const unescape = (text: string) =>
  text.replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => XML_ENTITIES[name] ?? '');

const field = (entry: string, name: string) => {
  const value = entry.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.at(1);
  return value === undefined ? undefined : unescape(value.trim());
};

const kindOf = (xml: string): Sitemap['kind'] => {
  if (/<sitemapindex\b/.test(xml)) return 'index';
  return /<urlset\b/.test(xml) ? 'urlset' : 'unknown';
};

/** Reads `<loc>` and `<lastmod>` from each `<sitemap>` or `<url>` entry. */
export function parseSitemap(xml: string): Sitemap {
  const kind = kindOf(xml);
  const tag = kind === 'index' ? 'sitemap' : 'url';
  const entries = [...xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map(([, entry]) => {
    const lastmod = field(entry, 'lastmod');
    return { loc: field(entry, 'loc') ?? '', ...(lastmod === undefined ? {} : { lastmod }) };
  });

  return { kind, entries };
}
