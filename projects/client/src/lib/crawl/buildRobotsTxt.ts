import { SITE_ORIGIN } from '../seo/siteOrigin.ts';
import { CRAWL_BLOCKED_PARAMS } from './crawlBlockedParams.ts';

/** The API proxies, the design system, the sign-in flow and the signed-in dashboard. */
const DISALLOWED_PATHS = ['/api/', '/_design', '/callback', '/auth/', '/logout', '/dashboard'];

/**
 * og's robots.txt. Production allows everything but `DISALLOWED_PATHS` and UI-state permutations; any other host
 * (previews, local dev) disallows everything.
 * No AI crawler rules here: Cloudflare's managed robots.txt for the trakt.tv zone prepends them on og.trakt.tv.
 */
export function buildRobotsTxt({ production }: { production: boolean }): string {
  if (!production) return ['User-agent: *', 'Disallow: /', ''].join('\n');

  return [
    'User-agent: *',
    'Allow: /',
    ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
    ...CRAWL_BLOCKED_PARAMS.map((param) => `Disallow: /*?*${param}=`),
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n');
}
