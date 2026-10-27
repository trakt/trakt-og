import { SITE_ORIGIN } from '../../../lib/seo/siteOrigin.ts';
import { buildUrlSet } from '../../../lib/sitemap/buildUrlSet.ts';
import { pageSitemapUrls } from '../../../lib/sitemap/pageSitemapUrls.ts';
import { sitemapResponse } from '../../../lib/sitemap/sitemapResponse.ts';

export const GET = ({ url }) =>
  sitemapResponse({ xml: buildUrlSet({ origin: SITE_ORIGIN, urls: pageSitemapUrls }), host: url.host });
