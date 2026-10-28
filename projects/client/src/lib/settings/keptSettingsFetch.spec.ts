import { describe, expect, it, vi } from 'vitest';
import { keptSettingsFetch, type ResponseCache, SETTINGS_TTL_SECONDS } from './keptSettingsFetch.ts';

const SETTINGS_URL = 'https://apiz.trakt.tv/users/settings?extended=browsing,sharing';
const SETTINGS = { user: { username: 'og_tester' } };

function memoryCache() {
  const entries = new Map<string, Response>();
  const cache: ResponseCache = {
    match: (key) => Promise.resolve(entries.get(key)?.clone()),
    put: (key, response) => {
      entries.set(key, response);
      return Promise.resolve();
    },
    delete: (key) => Promise.resolve(entries.delete(key)),
  };
  return { cache, entries };
}

const api = (status = 200) =>
  vi.fn<typeof fetch>(() =>
    Promise.resolve(status === 200 ? Response.json(SETTINGS) : new Response('Unauthorized', { status })),
  );

const read = async (fetch: typeof globalThis.fetch, overrides: Partial<Parameters<typeof keptSettingsFetch>[0]>) => {
  const kept = keptSettingsFetch({
    fetch,
    cache: undefined,
    origin: 'https://og.test',
    token: 'secret-token',
    revision: '',
    fresh: false,
    ...overrides,
  });
  const response = await kept(SETTINGS_URL);
  return { status: response.status, body: response.status === 200 ? await response.json() : null };
};

describe('keptSettingsFetch', () => {
  it('should read once, then answer from the kept copy', async () => {
    const { cache } = memoryCache();
    const fetch = api();

    expect(await read(fetch, { cache })).toEqual({ status: 200, body: SETTINGS });
    expect(await read(fetch, { cache })).toEqual({ status: 200, body: SETTINGS });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should keep the copy for the TTL under a key without the token', async () => {
    const { cache, entries } = memoryCache();

    await read(api(), { cache });

    const [key, response] = [...entries].at(0) ?? [];
    expect(key).toMatch(/^https:\/\/og\.test\/_cache\/settings\/[0-9a-f]{64}$/);
    expect(key).not.toContain('secret-token');
    expect(response?.headers.get('cache-control')).toBe(`public, max-age=${SETTINGS_TTL_SECONDS}`);
  });

  it('should read fresh for a full page load and replace the kept copy', async () => {
    const { cache } = memoryCache();
    await read(api(), { cache });
    const fetch = vi.fn<typeof globalThis.fetch>(() => Promise.resolve(Response.json({ user: { username: 'new' } })));

    expect(await read(fetch, { cache, fresh: true })).toEqual({ status: 200, body: { user: { username: 'new' } } });
    expect(await read(api(), { cache })).toEqual({ status: 200, body: { user: { username: 'new' } } });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should keep one copy per token and per revision', async () => {
    const { cache } = memoryCache();
    const fetch = api();

    await read(fetch, { cache });
    await read(fetch, { cache, token: 'other-token' });
    await read(fetch, { cache, revision: 'saved' });

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should never keep a refused read, and drop the copy once the token is refused', async () => {
    const { cache, entries } = memoryCache();
    await read(api(), { cache });

    expect(await read(api(401), { cache, fresh: true })).toEqual({ status: 401, body: null });
    expect(entries.size).toBe(0);

    const fetch = api(401);
    await read(fetch, { cache });
    await read(fetch, { cache });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should keep a copy through a server error', async () => {
    const { cache } = memoryCache();
    await read(api(), { cache });

    expect(await read(api(502), { cache, fresh: true })).toEqual({ status: 502, body: null });
    expect(await read(api(502), { cache })).toEqual({ status: 200, body: SETTINGS });
  });

  it('should read as if it missed when the cache fails', async () => {
    const failing: ResponseCache = {
      match: () => Promise.reject(new Error('down')),
      put: () => Promise.reject(new Error('down')),
      delete: () => Promise.reject(new Error('down')),
    };
    const fetch = api();

    expect(await read(fetch, { cache: failing })).toEqual({ status: 200, body: SETTINGS });
    expect(await read(fetch, { cache: failing })).toEqual({ status: 200, body: SETTINGS });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should always read without a cache', async () => {
    const fetch = api();

    await read(fetch, {});
    await read(fetch, {});

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
