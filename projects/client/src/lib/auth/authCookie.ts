/**
 * httpOnly cookie holding the access token and its expiry as JSON, so loaders can call apiz as the user.
 * Only /api/store-token writes it, and hooks.server.ts reads it with readAuthCookie.
 */
export const AUTH_COOKIE = 'og-auth';
