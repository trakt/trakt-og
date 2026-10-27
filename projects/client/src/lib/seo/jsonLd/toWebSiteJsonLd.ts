import { SEO_DEFAULTS } from '../seoDefaults.ts';
import { SITE_NAME } from '../siteName.ts';
import { SITE_ORIGIN } from '../siteOrigin.ts';
import type { JsonLd } from './JsonLd.ts';

/**
 * The site as schema.org's `WebSite`, published by its `Organization`. No `SearchAction`: Google retired the sitelinks
 * search box, and og's search pages are noindex.
 */
export function toWebSiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    description: SEO_DEFAULTS.description,
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
  };
}
