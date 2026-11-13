import type { RequestEvent } from '@sveltejs/kit';
import type { Handle, HandleFetch } from '@sveltejs/kit/hooks';
import { waitUntil } from 'cloudflare:workers';
import { AUTH_COOKIE } from './lib/auth/authCookie.ts';
import { apiEnvironment } from './lib/api/apiEnvironment.ts';
import { apiRateLimited } from './lib/api/apiRateLimited.ts';
import { cachedApiRead } from './lib/api/cachedApiRead.ts';
import { isStandardApi } from './lib/api/isStandardApi.ts';
import { rateLimitPause } from './lib/api/rateLimitPause.ts';
import { withUserAgent } from './lib/api/withUserAgent.ts';
import { readAuthCookie } from './lib/auth/readAuthCookie.ts';
import { detectCrawler } from './lib/crawl/detectCrawler.ts';
import { ENDPOINT_ROUTES } from './lib/crawl/endpointRoutes.ts';
import { previewHead } from './lib/crawl/previewHead.ts';
import { verifiedBotCategory } from './lib/crawl/verifiedBotCategory.ts';
import { withCrawlHeaders } from './lib/crawl/withCrawlHeaders.ts';
import { liveSocket } from './lib/live/liveSocket.ts';
import { liveSocketPath } from './lib/live/liveSocketPath.ts';
import { edgeCache } from './lib/utils/edgeCache.ts';

/**
 * Loaders call `api({ fetch: event.fetch, token: locals.token })`. The server never refreshes: a 401 renders logged-out.
 * An expired token never reaches the API. It sets `locals.tokenExpired`, so the page renders signed in while the
 * browser renews it.
 * The page's `<html data-theme>` is the viewer's Dark Knight setting, which the root layout's load puts in
 * `locals.theme` before the page renders, so the first paint needs no script. Anyone else gets Dark Knight, og's default.
 * Links preload their page's data on hover, or on tap for a Standard app, whose lower rate limit a sweep across links
 * would spend. A guest's links never preload, since a click sends them to sign in (`isGuestGated`). Their page's code, which
 * costs no API calls, loads as they scroll into view (`app.html`).
 * `locals.crawler` says whether a search engine or link-preview bot asked, and `withCrawlHeaders` sets the page's
 * cache and robots headers from it and the session. A bot that isn't a verified search engine gets a page's head alone
 * (`previewHead`), from one or two API reads; endpoints still answer it as usual, so preview art loads.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const { token, tokenExpired } = readAuthCookie({ value: event.cookies.get(AUTH_COOKIE), now: Date.now() });
  event.locals.token = token;
  event.locals.tokenExpired = tokenExpired;
  if (event.url.pathname === liveSocketPath) return liveSocket({ event, token });
  event.locals.crawler = detectCrawler({
    userAgent: event.request.headers.get('user-agent'),
    verifiedBotCategory: verifiedBotCategory(event.request),
  });

  const hasSession = token !== null || tokenExpired;
  const response = isHeadOnly(event)
    ? await previewHead({
        routeId: event.route.id,
        params: event.params,
        url: event.url,
        fetch: event.fetch,
        now: new Date(),
      })
    : await resolve(event, {
        transformPageChunk: ({ html }) =>
          html.replace('%og.theme%', event.locals.theme ?? 'dark').replace('%og.preload%', preloadData(hasSession)),
      });
  return withCrawlHeaders({
    response,
    url: event.url,
    hasSession,
    crawler: event.locals.crawler,
  });
};

const preloadData = (hasSession: boolean) => {
  if (!hasSession) return 'off';
  return isStandardApi() ? 'tap' : 'hover';
};

const isHeadOnly = ({ locals, request, route }: RequestEvent) =>
  locals.crawler.headOnly &&
  (request.method === 'GET' || request.method === 'HEAD') &&
  !(route.id && ENDPOINT_ROUTES.has(route.id));

async function send(request: Request, fetch: typeof globalThis.fetch, read: boolean): Promise<Response> {
  const standard = isStandardApi();
  const left = rateLimitPause.remaining();
  if (read && standard && left > 0) apiRateLimited(String(left));

  const response = await fetch(withUserAgent(request));
  if (response.status === 429 && read) {
    const retryAfter = response.headers.get('retry-after');
    if (standard) rateLimitPause.start(retryAfter);
    apiRateLimited(retryAfter);
  }
  return response;
}

/**
 * Loaders' server fetches name og as their User-Agent (`withUserAgent`), so the API's firewall lets them through. An API
 * read the API rate limits throws `apiRateLimited`: a required read renders the error page with Try again, and a
 * streamed section's LoadFailed says why. A Standard app then holds its reads until `Retry-After` runs out
 * (`rateLimitPause`), without sending them. Public reads without a token go through the data center's cache
 * (`cachedApiRead`), which can answer them even while the reads are held.
 */
export const handleFetch: HandleFetch = ({ event, request, fetch }) => {
  const read = request.method === 'GET' && request.url.startsWith(apiEnvironment());
  const { locals, url } = event;
  const cache = edgeCache();
  if (!read || !cache) return send(request, fetch, read);

  return cachedApiRead({
    request,
    cache,
    origin: url.origin,
    signedIn: locals.token !== null || locals.tokenExpired,
    load: () => send(request, fetch, read),
    waitUntil,
  });
};
