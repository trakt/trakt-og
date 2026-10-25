import { storedTokenSchema } from './storedTokenSchema.ts';

type ReadAuthCookieParams = {
  value: string | undefined;
  now: number;
};

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * The token loaders may send, and whether the cookie held one that has since expired.
 * The cookie outlives its token, so an expired one still marks a session for the browser to renew.
 * Cookies from before the expiry was stored hold a bare token. The browser dropped those when they expired,
 * so one that arrives is still live.
 */
export function readAuthCookie({ value, now }: ReadAuthCookieParams): { token: string | null; tokenExpired: boolean } {
  if (!value) return { token: null, tokenExpired: false };

  const stored = storedTokenSchema.safeParse(parseJson(value)).data;
  if (!stored) return { token: value, tokenExpired: false };

  return stored.expiresAt > now ? { token: stored.token, tokenExpired: false } : { token: null, tokenExpired: true };
}
