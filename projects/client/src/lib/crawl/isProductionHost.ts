import { SITE_ORIGIN } from '../seo/siteOrigin.ts';

const PRODUCTION_HOST = new URL(SITE_ORIGIN).host;

/** Only og.trakt.tv may be indexed. Previews and local dev ask search engines to stay out. */
export function isProductionHost(url: URL): boolean {
  return url.host === PRODUCTION_HOST;
}
