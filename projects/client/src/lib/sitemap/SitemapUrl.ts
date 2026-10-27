/** One page in a sitemap: its path on og, and when its content last changed, if the API says. */
export type SitemapUrl = {
  readonly path: string;
  readonly lastmod?: string;
};
