import { AUTH_COOKIE } from '../../../lib/auth/authCookie.ts';
import { storedTokenSchema } from '../../../lib/auth/storedTokenSchema.ts';
import type { RequestHandler } from '@sveltejs/kit';

/** A year, so the cookie outlives the token and a returning viewer still renders signed in while it renews. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Sets the httpOnly cookie loaders read. The browser POSTs `{ token, expiresAt }` after login and every renewal.
 * Anything else, including `{ token: null }` on logout or a token that has already expired, clears it.
 * SvelteKit's CSRF check rejects cross-site form posts.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  const stored = storedTokenSchema.safeParse(await request.json().catch(() => null)).data;

  if (!stored || stored.expiresAt <= Date.now()) {
    cookies.delete(AUTH_COOKIE, { path: '/' });
    return new Response(null, { status: 204 });
  }

  cookies.set(AUTH_COOKIE, JSON.stringify(stored), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
  });
  return new Response(null, { status: 204 });
};
