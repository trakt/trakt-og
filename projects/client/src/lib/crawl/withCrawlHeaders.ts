import type { detectCrawler } from './detectCrawler.ts';
import { isProductionHost } from './isProductionHost.ts';
import { resolveCacheControl } from './resolveCacheControl.ts';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

type WithCrawlHeadersParams = {
  response: Response;
  url: URL;
  hasSession: boolean;
  crawler: ReturnType<typeof detectCrawler>;
};

const varyOnCookie = (vary: string | null) =>
  vary?.split(',').some((name) => name.trim().toLowerCase() === 'cookie')
    ? vary
    : [vary, 'Cookie'].filter(Boolean).join(', ');

/**
 * Every page and redirect gets its `Cache-Control` (`resolveCacheControl`) and `Vary: Cookie`, since the root
 * layout renders them for the viewer's session. Any host but og.trakt.tv adds `X-Robots-Tag: noindex` to everything.
 * A copy is returned, since a fetched response's headers can't be changed.
 */
export function withCrawlHeaders({ response, url, hasSession, crawler }: WithCrawlHeadersParams): Response {
  const production = isProductionHost(url);
  const isRedirect = REDIRECT_STATUSES.has(response.status);
  const isPage = isRedirect || (response.headers.get('content-type')?.includes('text/html') ?? false);
  if (production && !isPage) return response;

  const headers = new Headers(response.headers);
  if (!production) headers.set('x-robots-tag', 'noindex');
  if (isPage) {
    const pageCacheControl = response.headers.get('cache-control');
    headers.set(
      'cache-control',
      resolveCacheControl({ pathname: url.pathname, isRedirect, hasSession, crawler, pageCacheControl }),
    );
    headers.set('vary', varyOnCookie(headers.get('vary')));
  }

  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
