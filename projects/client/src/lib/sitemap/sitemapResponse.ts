import { SITE_ORIGIN } from '../seo/siteOrigin.ts';

const DAY_SECONDS = 24 * 60 * 60;
const PRODUCTION_HOST = new URL(SITE_ORIGIN).host;

type SitemapResponseParams = {
  /** The sitemap, or null when the API failed to send all of it. */
  xml: string | null;
  /** The host serving it. Anywhere but og.trakt.tv asks search engines not to index it. */
  host: string;
};

/**
 * A sitemap file, cached for a day. Without one it's a 503 that's never cached, so a search engine keeps the file it
 * had and asks again later instead of reading a short one as pages gone.
 */
export function sitemapResponse({ xml, host }: SitemapResponseParams): Response {
  const headers = new Headers(host === PRODUCTION_HOST ? {} : { 'X-Robots-Tag': 'noindex' });

  if (xml === null) {
    headers.set('Cache-Control', 'no-store');
    headers.set('Retry-After', '3600');
    return new Response('Sitemap unavailable: the Trakt API did not answer.', { status: 503, headers });
  }

  headers.set('Content-Type', 'application/xml; charset=utf-8');
  headers.set('Cache-Control', `public, max-age=${DAY_SECONDS}, s-maxage=${DAY_SECONDS}`);
  return new Response(xml, { headers });
}
