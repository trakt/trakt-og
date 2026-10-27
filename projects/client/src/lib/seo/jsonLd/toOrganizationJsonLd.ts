import { traktUrls } from '../../traktUrls.ts';
import { SITE_NAME } from '../siteName.ts';
import { SITE_ORIGIN } from '../siteOrigin.ts';
import type { JsonLd } from './JsonLd.ts';

/** The site as schema.org's `Organization`, with the classic red mark and the accounts the footer links. */
export function toOrganizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_ORIGIN}/#organization`,
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    logo: `${SITE_ORIGIN}/apple-touch-icon.png`,
    sameAs: [traktUrls.reddit, traktUrls.mastodon, traktUrls.twitter, traktUrls.youtube, traktUrls.github],
  };
}
