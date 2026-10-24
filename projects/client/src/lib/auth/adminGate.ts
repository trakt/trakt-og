import { z } from 'zod/v4';

/** Paths anyone can load while og is admin-only: the placeholder, and what signing in and out needs. */
const OPEN_PATHS = new Set(['/', '/auth/signin', '/callback', '/logout', '/api/store-token']);

const USERINFO = 'https://auth.trakt.tv/api/auth/oauth2/userinfo';

/** The userinfo claim that marks an admin. Only a literal `true` counts. */
const adminClaimsSchema = z.object({ u: z.object({ a: z.literal(true) }) });

/** Whether the gate lets this path through for everyone. SvelteKit's `__data.json` requests count as their page. */
export function isOpenPath(pathname: string): boolean {
  if (pathname.startsWith('/_app/')) return true;

  return OPEN_PATHS.has(pathname.replace(/\/?__data\.json$/, '') || '/');
}

/** How long a confirmed admin token skips the userinfo call. A revoked admin keeps access this long at most. */
export const ADMIN_TTL_MS = 5 * 60 * 1000;

/** Token SHA-256 hashes to when their admin answer expires. One per Worker isolate. */
const confirmedAdmins = new Map<string, number>();

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function fetchIsAdmin(token: string, fetch: typeof globalThis.fetch) {
  try {
    const response = await fetch(USERINFO, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return false;

    return adminClaimsSchema.safeParse(await response.json()).success;
  } catch {
    return false;
  }
}

/**
 * Checks whether the token is authorized for the launch gate.
 * Any failure (no token, expired, network) is "not an admin".
 * A yes is remembered for `ADMIN_TTL_MS`, so page navigations skip the userinfo round trip. A no is never remembered.
 */
export async function isAdmin({
  token,
  fetch,
  cache = confirmedAdmins,
}: {
  token: string | null;
  fetch: typeof globalThis.fetch;
  cache?: Map<string, number>;
}) {
  if (token === null) return false;

  const key = await hashToken(token);
  if ((cache.get(key) ?? 0) > Date.now()) return true;

  cache.delete(key);
  const admin = await fetchIsAdmin(token, fetch);
  if (admin) cache.set(key, Date.now() + ADMIN_TTL_MS);
  return admin;
}
