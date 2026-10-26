import { isAdmin, isOpenPath } from './lib/auth/adminGate.ts';
import { AUTH_COOKIE } from './lib/auth/authCookie.ts';
import { apiEnvironment } from './lib/api/apiEnvironment.ts';
import { apiRateLimited } from './lib/api/apiRateLimited.ts';
import { isStandardApi } from './lib/api/isStandardApi.ts';
import { rateLimitPause } from './lib/api/rateLimitPause.ts';
import { withUserAgent } from './lib/api/withUserAgent.ts';
import { readAuthCookie } from './lib/auth/readAuthCookie.ts';
import { type Handle, type HandleFetch, redirect } from '@sveltejs/kit';

/**
 * Loaders call `api({ fetch: event.fetch, token: locals.token })`. The server never refreshes: a 401 renders logged-out.
 * An expired token never reaches the API. It sets `locals.tokenExpired`, so the page renders signed in while the
 * browser renews it.
 * Until launch, og.trakt.tv is admin-only: everyone else is sent to the placeholder at `/`.
 * Local dev and preview turn the gate off with `OG_ADMIN_GATE=off` in `.dev.vars`. A deploy never reads that file.
 * The page's `<html data-theme>` is the viewer's Dark Knight setting, which the root layout's load puts in
 * `locals.theme` before the page renders, so the first paint needs no script. Anyone else gets Dark Knight, og's default.
 * Links preload their page's data on hover, or on tap for a Standard app, whose lower rate limit a sweep across links
 * would spend.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const { token, tokenExpired } = readAuthCookie({ value: event.cookies.get(AUTH_COOKIE), now: Date.now() });
  event.locals.token = token;
  event.locals.tokenExpired = tokenExpired;

  const gated = event.platform?.env.OG_ADMIN_GATE !== 'off';
  if (gated && !isOpenPath(event.url.pathname) && !(await isAdmin({ token: event.locals.token, fetch }))) {
    redirect(302, '/');
  }

  return resolve(event, {
    transformPageChunk: ({ html }) =>
      html
        .replace('%og.theme%', event.locals.theme ?? 'dark')
        .replace('%og.preload%', isStandardApi() ? 'tap' : 'hover'),
  });
};

/**
 * Loaders' server fetches name og as their User-Agent (`withUserAgent`), so the API's firewall lets them through. An API
 * read the API rate limits throws `apiRateLimited`: a required read renders the error page with Try again, and a
 * streamed section's LoadFailed says why. A Standard app then holds its reads until `Retry-After` runs out
 * (`rateLimitPause`), without sending them.
 */
export const handleFetch: HandleFetch = async ({ request, fetch }) => {
  const read = request.method === 'GET' && request.url.startsWith(apiEnvironment());
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
};
