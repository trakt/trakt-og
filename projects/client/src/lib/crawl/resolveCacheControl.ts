import type { detectCrawler } from './detectCrawler.ts';

const NO_STORE = 'no-store';

type ResolveCacheControlParams = {
  pathname: string;
  isRedirect: boolean;
  hasSession: boolean;
  crawler: ReturnType<typeof detectCrawler>;
  /** The `Cache-Control` the page set itself, if any. */
  pageCacheControl: string | null;
};

/**
 * The `Cache-Control` for an HTML page or a redirect. A signed-in page, a redirect and `/` (the home page, or the
 * dashboard once signed in) are never stored, whatever the page asked for. Otherwise a page's own header wins.
 * Verified crawlers may keep the signed-out page for an hour, and link-preview bots for two minutes.
 * Never `public`: the Cloudflare adapter stores any shared-cacheable response in the data center's cache, keyed by
 * URL alone (the Cache API ignores `Vary: Cookie`), and serves it before the hooks run, so a crawler's signed-out copy
 * would reach signed-in viewers.
 */
export function resolveCacheControl({
  pathname,
  isRedirect,
  hasSession,
  crawler,
  pageCacheControl,
}: ResolveCacheControlParams): string {
  if (hasSession) return NO_STORE;
  if (isRedirect) return NO_STORE;
  if (pathname === '/') return NO_STORE;
  if (pageCacheControl) return pageCacheControl;
  if (crawler.verified) return 'private, max-age=3600';
  if (crawler.bot) return 'private, max-age=120';
  return NO_STORE;
}
