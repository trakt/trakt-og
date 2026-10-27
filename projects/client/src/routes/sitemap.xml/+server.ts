import { SITE_ORIGIN } from '../../lib/seo/siteOrigin.ts';
import { buildSitemapIndex } from '../../lib/sitemap/buildSitemapIndex.ts';
import { sitemapResponse } from '../../lib/sitemap/sitemapResponse.ts';

const paths = ['/sitemap/pages.xml', '/sitemap/movies.xml', '/sitemap/shows.xml', '/sitemap/lists.xml'];

export const GET = ({ url }) =>
  sitemapResponse({ xml: buildSitemapIndex({ origin: SITE_ORIGIN, paths }), host: url.host });
