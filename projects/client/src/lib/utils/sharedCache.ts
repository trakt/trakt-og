/** The two methods used from Cloudflare's `Cache`, so the browser's and the Worker's types both fit. */
export interface KeyedCache {
  match(key: string): Promise<{ json(): Promise<unknown> } | undefined>;
  put(key: string, response: Response): Promise<void>;
}

interface SharedCacheParams<T> {
  /** The data center's cache, `platform.caches.default`. Left out (tests, a dev server without one), it always loads. */
  cache: KeyedCache | undefined;
  /** A URL on og's own origin that names the value, like `https://og.trakt.tv/_cache/home/live`. */
  key: string;
  ttlSeconds: number;
  /** The cached JSON back as a value, or null when it no longer has the shape (an older deploy wrote it). */
  parse: (value: unknown) => T | null;
  load: () => Promise<T>;
}

/**
 * One JSON value kept in Cloudflare's cache for the data center a request runs in, so every worker there shares it
 * instead of each loading its own. A hit that doesn't parse, or a cache that fails, loads as if it missed; a failed
 * write still returns the value. Cloudflare's cache only works on a custom domain, never on workers.dev.
 */
export async function sharedCache<T>({ cache, key, ttlSeconds, parse, load }: SharedCacheParams<T>): Promise<T> {
  if (!cache) return load();

  const hit = await cache.match(key).catch(() => undefined);
  const kept = hit ? parse(await hit.json().catch(() => null)) : null;
  if (kept !== null) return kept;

  const value = await load();
  const response = new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${ttlSeconds}` },
  });
  await cache.put(key, response).catch(() => undefined);
  return value;
}
