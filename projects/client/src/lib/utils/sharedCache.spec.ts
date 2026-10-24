import { describe, expect, it, vi } from 'vitest';
import { type KeyedCache, sharedCache } from './sharedCache.ts';

const KEY = 'https://og.trakt.tv/_cache/test';

/** A cache with Cloudflare's `match` and `put`, kept in a map. */
function memoryCache() {
  const kept = new Map<string, string>();
  const cache = {
    match: (key: string) => Promise.resolve(kept.has(key) ? new Response(kept.get(key)) : undefined),
    put: async (key: string, response: Response) => void kept.set(key, await response.text()),
  };
  return { cache: cache satisfies KeyedCache, kept };
}

const isCount = (value: unknown) =>
  typeof value === 'object' && value !== null && 'count' in value && typeof value.count === 'number'
    ? { count: value.count }
    : null;

describe('util: sharedCache', () => {
  it('should load and keep the value on a miss', async () => {
    const { cache, kept } = memoryCache();
    const load = vi.fn(() => Promise.resolve({ count: 3 }));

    expect(await sharedCache({ cache, key: KEY, ttlSeconds: 60, parse: isCount, load })).toEqual({ count: 3 });
    expect(load).toHaveBeenCalledOnce();
    expect(kept.get(KEY)).toBe('{"count":3}');
  });

  it('should answer from the cache without loading on a hit', async () => {
    const { cache, kept } = memoryCache();
    kept.set(KEY, '{"count":7}');
    const load = vi.fn(() => Promise.resolve({ count: 3 }));

    expect(await sharedCache({ cache, key: KEY, ttlSeconds: 60, parse: isCount, load })).toEqual({ count: 7 });
    expect(load).not.toHaveBeenCalled();
  });

  it('should load again when the cached value no longer parses', async () => {
    const { cache, kept } = memoryCache();
    kept.set(KEY, '{"total":7}');

    expect(
      await sharedCache({ cache, key: KEY, ttlSeconds: 60, parse: isCount, load: () => Promise.resolve({ count: 3 }) }),
    ).toEqual({ count: 3 });
    expect(kept.get(KEY)).toBe('{"count":3}');
  });

  it('should still return the value when the cache fails', async () => {
    const cache = {
      match: () => Promise.reject(new Error('down')),
      put: () => Promise.reject(new Error('down')),
    } satisfies KeyedCache;

    expect(
      await sharedCache({ cache, key: KEY, ttlSeconds: 60, parse: isCount, load: () => Promise.resolve({ count: 3 }) }),
    ).toEqual({ count: 3 });
  });

  it('should load every time without a cache', async () => {
    const load = vi.fn(() => Promise.resolve({ count: 3 }));
    await sharedCache({ cache: undefined, key: KEY, ttlSeconds: 60, parse: isCount, load });
    await sharedCache({ cache: undefined, key: KEY, ttlSeconds: 60, parse: isCount, load });

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('should keep the value for its time to live', async () => {
    const put = vi.fn((_key: string, _response: Response) => Promise.resolve());
    const cache = { match: () => Promise.resolve(undefined), put } satisfies KeyedCache;
    await sharedCache({ cache, key: KEY, ttlSeconds: 900, parse: isCount, load: () => Promise.resolve({ count: 3 }) });

    expect(put.mock.calls.at(0)?.[1].headers.get('cache-control')).toBe('public, max-age=900');
  });
});
