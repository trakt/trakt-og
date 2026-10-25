import { isAdmin, isOpenPath } from './lib/auth/adminGate.ts';
import { AUTH_COOKIE } from './lib/auth/authCookie.ts';
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
    transformPageChunk: ({ html }) => html.replace('%og.theme%', event.locals.theme ?? 'dark'),
  });
};

/** Loaders' server fetches name og as their User-Agent (`withUserAgent`), so the API's firewall lets them through. */
export const handleFetch: HandleFetch = ({ request, fetch }) => fetch(withUserAgent(request));
