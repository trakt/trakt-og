/** A sitemap index or URL set, read from its XML. */
export interface Sitemap {
  kind: 'index' | 'urlset' | 'unknown';
  entries: readonly { loc: string; lastmod?: string }[];
}
