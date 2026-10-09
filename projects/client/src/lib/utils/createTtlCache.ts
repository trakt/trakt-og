interface CreateTtlCacheParams {
  /** How long a loaded value stays fresh. */
  ttlMs: number;
  /** After a failed reload, how long to keep serving the last good value before trying again. */
  retryMs: number;
}

interface GetParams<T> {
  now: number;
  load: () => Promise<T>;
}

/**
 * One value kept in memory for `ttlMs`. On Cloudflare that's per isolate, so it saves repeat API calls on a warm
 * worker without being shared or guaranteed. Only settled values are kept: a Worker can't hand one request's pending
 * I/O to another, so requests that arrive during a load each load for themselves. A failed reload keeps serving the
 * last good value for `retryMs`; with nothing to fall back on, the error reaches the caller.
 */
export function createTtlCache<T>({ ttlMs, retryMs }: CreateTtlCacheParams) {
  let cached: { value: T; expires: number } | undefined;

  return async function get({ now, load }: GetParams<T>): Promise<T> {
    if (cached && now < cached.expires) return cached.value;

    try {
      const value = await load();
      cached = { value, expires: now + ttlMs };
      return value;
    } catch (reason) {
      if (!cached) throw reason;
      cached = { value: cached.value, expires: now + retryMs };
      return cached.value;
    }
  };
}
