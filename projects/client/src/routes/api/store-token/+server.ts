import { AUTH_COOKIE } from '../../../lib/auth/authCookie.ts';
import type { RequestHandler } from '@sveltejs/kit';
import { z } from 'zod/v4';

/** A non-empty token that hasn't expired by `now`. */
const storedTokenSchema = (now: number) => z.object({ token: z.string().min(1), expiresAt: z.number().gt(now) });

/**
 * Sets the httpOnly cookie loaders read. The browser POSTs `{ token, expiresAt }` after login and every renewal.
 * Anything else, including `{ token: null }` on logout, clears it. SvelteKit's CSRF check rejects cross-site form posts.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  const stored = storedTokenSchema(Date.now()).safeParse(await request.json().catch(() => null)).data;

  if (!stored) {
    cookies.delete(AUTH_COOKIE, { path: '/' });
    return new Response(null, { status: 204 });
  }

  cookies.set(AUTH_COOKIE, stored.token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    expires: new Date(stored.expiresAt),
  });
  return new Response(null, { status: 204 });
};
