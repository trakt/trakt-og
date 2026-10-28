/** The three methods used from Cloudflare's `Cache`, so the browser's and the Worker's types both fit. */
export interface ResponseCache {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
  delete(key: string): Promise<boolean>;
}

/**
 * How long a viewer's settings are kept. Settings changed outside og (trakt.tv, the apps) can take this long to reach
 * a client navigation; a full page load always reads them fresh.
 */
export const SETTINGS_TTL_SECONDS = 5 * 60;

interface KeptSettingsFetchParams {
  fetch: typeof globalThis.fetch;
  /** The data center's cache, `platform.caches.default`. Left out (tests, a dev server without one), it always reads. */
  cache: ResponseCache | undefined;
  /** og's origin, which the kept copies' keys live under. */
  origin: string;
  /** The viewer's access token. Only its hash reaches the key. */
  token: string;
  /** The settings revision cookie (`markSettingsChanged`), so a save in og starts a new copy. */
  revision: string;
  /** Skip the kept copy and replace it: a full page load. */
  fresh: boolean;
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * `fetch` for the root layout's `GET /users/settings`, kept in the data center's cache for `SETTINGS_TTL_SECONDS`
 * under a hash of the token and the revision cookie. Client navigations rerun the root layout for every child that
 * calls `parent()`, so without it each click waited on one settings read. Only a 200 is kept, and a 401 drops the
 * copy, so a refused token renders logged out as before. A cache that fails reads as if it missed.
 * Cloudflare's cache only works on a custom domain, never on workers.dev.
 */
export function keptSettingsFetch({
  fetch,
  cache,
  origin,
  token,
  revision,
  fresh,
}: KeptSettingsFetchParams): typeof globalThis.fetch {
  if (!cache) return fetch;

  return async (input, init) => {
    const key = `${origin}/_cache/settings/${await sha256(`${revision}:${token}`)}`;
    const kept = fresh ? undefined : await cache.match(key).catch(() => undefined);
    if (kept) return kept;

    const response = await fetch(input, init);
    if (response.status === 401) await cache.delete(key).catch(() => false);
    if (response.status !== 200) return response;

    const copy = new Response(await response.clone().arrayBuffer(), {
      headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${SETTINGS_TTL_SECONDS}` },
    });
    await cache.put(key, copy).catch(() => undefined);
    return response;
  };
}
