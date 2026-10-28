import { describe, expect, it, vi } from 'vitest';
import { cachedApiRead } from './cachedApiRead.ts';
import type { ResponseCache } from './ResponseCache.ts';

const API = 'https://apiz.trakt.tv';
const ORIGIN = 'https://og.trakt.tv';

type Kept = { status: number; headers: [string, string][]; body: string };

/** A cache with Cloudflare's `match` and `put`, kept in a map. */
function memoryCache() {
  const kept = new Map<string, Kept>();
  const cache = {
    match: (key: string) => {
      const entry = kept.get(key);
      return Promise.resolve(entry ? new Response(entry.body, entry) : undefined);
    },
    put: async (key: string, response: Response) => {
      kept.set(key, { status: response.status, headers: [...response.headers], body: await response.text() });
    },
  };
  return { cache: cache satisfies ResponseCache, kept };
}

const apiResponse = (body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) =>
  new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=600', ...init.headers },
  });

type ReadParams = {
  cache: ResponseCache;
  load: () => Promise<Response>;
  path: string;
  headers?: Record<string, string>;
  signedIn?: boolean;
  waitUntil?: (promise: Promise<unknown>) => void;
  base?: string;
};

const read = ({ cache, load, path, headers, signedIn = false, waitUntil, base = API }: ReadParams) =>
  cachedApiRead({
    request: new Request(`${base}${path}`, { headers }),
    cache,
    origin: ORIGIN,
    signedIn,
    load,
    waitUntil,
  });

const loader = (make: () => Response = () => apiResponse([{ title: 'Tron' }])) => vi.fn(() => Promise.resolve(make()));

describe('util: cachedApiRead', () => {
  it('should read the API once and answer the next read from the cache', async () => {
    const { cache } = memoryCache();
    const load = loader();

    await read({ cache, load, path: '/movies/trending' });
    const second = await read({ cache, load, path: '/movies/trending' });

    expect(load).toHaveBeenCalledOnce();
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual([{ title: 'Tron' }]);
  });

  it('should keep the paging, sort and trending headers loaders read', async () => {
    const { cache } = memoryCache();
    const headers = {
      'x-pagination-page': '2',
      'x-pagination-page-count': '79',
      'x-pagination-item-count': '158',
      'x-sort-by': 'rank',
      'x-sort-how': 'asc',
      'x-trending-user-count': '2656',
    };
    const load = loader(() => apiResponse([], { headers }));

    await read({ cache, load, path: '/movies/trending?page=2' });
    const hit = await read({ cache, load, path: '/movies/trending?page=2' });

    expect(load).toHaveBeenCalledOnce();
    expect(Object.fromEntries(Object.keys(headers).map((name) => [name, hit.headers.get(name)]))).toEqual(headers);
  });

  it('should hand back the API response itself on a miss', async () => {
    const { cache } = memoryCache();
    const response = apiResponse({ title: 'Tron' });

    expect(await read({ cache, load: () => Promise.resolve(response), path: '/movies/tron-1982' })).toBe(response);
    expect(await response.json()).toEqual({ title: 'Tron' });
  });

  it('should share one copy whatever order and encoding the query has', async () => {
    const { cache, kept } = memoryCache();
    const load = loader();

    await read({ cache, load, path: '/movies/trending?limit=20&extended=full,images' });
    await read({ cache, load, path: '/movies/trending?extended=full%2Cimages&limit=20' });

    expect(load).toHaveBeenCalledOnce();
    expect([...kept.keys()]).toEqual([
      `${ORIGIN}/_cache/api/${TRAKT_CLIENT_ID}/apiz.trakt.tv/movies/trending?extended=full%2Cimages&limit=20`,
    ]);
  });

  it('should keep the Standard API apart from production', async () => {
    const { cache } = memoryCache();
    const load = loader();

    await read({ cache, load, path: '/movies/trending' });
    await read({ cache, load, path: '/movies/trending', base: 'https://api.trakt.tv' });

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('should keep different queries apart', async () => {
    const { cache } = memoryCache();
    const load = loader();

    await read({ cache, load, path: '/movies/trending?page=1' });
    await read({ cache, load, path: '/movies/trending?page=2' });

    expect(load).toHaveBeenCalledTimes(2);
  });

  describe('for reads that are not the same for everyone', () => {
    it('should never read or keep a read with a token', async () => {
      const { cache, kept } = memoryCache();
      const load = loader();
      await read({ cache, load, path: '/movies/trending' });

      await read({ cache, load, path: '/movies/trending', headers: { authorization: 'Bearer viewer-token' } });

      expect(load).toHaveBeenCalledTimes(2);
      expect(kept.size).toBe(1);
    });

    it('should never keep a read with a cookie', async () => {
      const { cache, kept } = memoryCache();

      await read({ cache, load: loader(), path: '/movies/trending', headers: { cookie: 'session=1' } });

      expect(kept.size).toBe(0);
    });

    it.each(['/sync/history', '/v3/users/me/lists', '/users/me/history', '/movies/tron-1982/watching'])(
      'should never keep %s',
      async (path) => {
        const { cache, kept } = memoryCache();

        await read({ cache, load: loader(), path });

        expect(kept.size).toBe(0);
      },
    );

    it.each(['private, max-age=600', 'public, no-store', 'public, no-cache, max-age=600', 'no-cache', 'public'])(
      'should never keep a response the API marks %s',
      async (cacheControl) => {
        const { cache, kept } = memoryCache();

        await read({
          cache,
          load: loader(() => apiResponse([], { headers: { 'cache-control': cacheControl } })),
          path: '/movies/trending',
        });

        expect(kept.size).toBe(0);
      },
    );

    it('should never keep a response without a Cache-Control', async () => {
      const { cache, kept } = memoryCache();

      await read({ cache, load: loader(() => new Response('[]', { status: 200 })), path: '/movies/trending' });

      expect(kept.size).toBe(0);
    });

    it.each([204, 404, 500, 502])('should never keep a %i', async (status) => {
      const { cache, kept } = memoryCache();
      const load = loader(
        () =>
          new Response(status === 204 ? null : '{}', { status, headers: { 'cache-control': 'public, max-age=600' } }),
      );

      expect((await read({ cache, load, path: '/movies/tron-1982' })).status).toBe(status);
      expect(kept.size).toBe(0);
    });
  });

  describe('for what members write', () => {
    it('should answer a visitor without a session from the cache', async () => {
      const { cache } = memoryCache();
      const load = loader();

      await read({ cache, load, path: '/users/justin/stats' });
      await read({ cache, load, path: '/users/justin/stats' });

      expect(load).toHaveBeenCalledOnce();
    });

    it("should read the API for a signed-in viewer, and refresh visitors' copy", async () => {
      const { cache } = memoryCache();
      await read({ cache, load: loader(() => apiResponse({ plays: 1 })), path: '/users/justin/stats' });
      const signedInLoad = loader(() => apiResponse({ plays: 2 }));

      const signedIn = await read({ cache, load: signedInLoad, path: '/users/justin/stats', signedIn: true });
      const visitor = await read({ cache, load: loader(), path: '/users/justin/stats' });

      expect(signedInLoad).toHaveBeenCalledOnce();
      expect(await signedIn.json()).toEqual({ plays: 2 });
      expect(await visitor.json()).toEqual({ plays: 2 });
    });

    it('should answer a signed-in viewer from the cache for catalog data', async () => {
      const { cache } = memoryCache();
      const load = loader();

      await read({ cache, load, path: '/movies/tron-1982' });
      await read({ cache, load, path: '/movies/tron-1982', signedIn: true });

      expect(load).toHaveBeenCalledOnce();
    });
  });

  describe('the kept copy', () => {
    const keptHeaders = async (path: string, headers: Record<string, string>) => {
      const { cache, kept } = memoryCache();
      await read({ cache, load: loader(() => apiResponse([], { headers })), path });
      return new Headers([...kept.values()].at(0)?.headers);
    };

    it("should keep a chart for 5 minutes, under the API's 10", async () => {
      expect((await keptHeaders('/movies/trending', {})).get('cache-control')).toBe('public, max-age=300');
    });

    it("should keep comments for the API's 1 minute, under the policy's 5", async () => {
      const headers = await keptHeaders('/movies/tron-1982/comments/likes', {
        'cache-control': 'public, max-age=60, s-maxage=180',
      });
      expect(headers.get('cache-control')).toBe('public, max-age=60');
    });

    it('should drop the cookie, encoding and vary headers', async () => {
      const headers = await keptHeaders('/movies/trending', {
        'set-cookie': 'a=1',
        'content-encoding': 'gzip',
        vary: 'query, Origin, accept-encoding',
        'x-pagination-page': '1',
      });

      expect(['set-cookie', 'content-encoding', 'vary'].filter((name) => headers.has(name))).toEqual([]);
      expect(headers.get('x-pagination-page')).toBe('1');
    });
  });

  it('should hand the write to waitUntil instead of waiting on it', async () => {
    const { cache, kept } = memoryCache();
    const writes: Promise<unknown>[] = [];

    await read({ cache, load: loader(), path: '/movies/trending', waitUntil: (promise) => writes.push(promise) });
    await Promise.all(writes);

    expect(writes).toHaveLength(1);
    expect(kept.size).toBe(1);
  });

  it('should read the API when the cache fails', async () => {
    const cache = {
      match: () => Promise.reject(new Error('down')),
      put: () => Promise.reject(new Error('down')),
    } satisfies ResponseCache;

    const response = await read({ cache, load: loader(), path: '/movies/trending' });

    expect(await response.json()).toEqual([{ title: 'Tron' }]);
  });
});
