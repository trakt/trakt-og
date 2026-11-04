import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { isStandardApi } from '../../api/isStandardApi.ts';
import type { KeyedCache } from '../../utils/sharedCache.ts';
import { fetchUserMatch } from './fetchUserMatch.ts';

vi.mock('../../api/isStandardApi.ts', () => ({ isStandardApi: vi.fn(() => false) }));

const body = {
  score: 81,
  breakdown: { subgenres: 70, favorites: 33 },
  shared: { subgenres: [{ name: 'heist', slug: 'heist', rarity: 0.2 }], favorites: { movies: [5], shows: [] } },
};
const seen: Request[] = [];
let status = 200;
const server = setupServer(
  http.get('https://apiz.trakt.tv/v3/users/:slug/match', ({ request }) => {
    seen.push(request);
    return status === 200 ? HttpResponse.json(body) : new HttpResponse('User profile is private', { status });
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
  status = 200;
});
afterAll(() => server.close());

const memoryCache = () => {
  const kept = new Map<string, string>();
  const cache = {
    match: (key: string) => Promise.resolve(kept.has(key) ? new Response(kept.get(key)) : undefined),
    put: async (key: string, response: Response) => void kept.set(key, await response.text()),
  } satisfies KeyedCache;
  return { kept, cache };
};
const read = (cache?: KeyedCache, token = 'viewer') =>
  fetchUserMatch({ fetch, token, slug: 'sean', cache, origin: 'https://og.trakt.tv' });

describe('fetchUserMatch', () => {
  it("should read the viewer's match with the owner and map it", async () => {
    const match = await read();
    expect(new URL(seen.at(0)?.url ?? '').pathname).toBe('/v3/users/sean/match');
    expect(seen.at(0)?.headers.get('authorization')).toBe('Bearer viewer');
    expect(match).toMatchObject({ score: 81, level: { key: 'co-stars' }, subgenres: 70, favorites: 33 });
  });

  it('should keep it in the data center cache under a hash of the token, and read it from there next time', async () => {
    const { kept, cache } = memoryCache();
    const first = await read(cache);
    const second = await read(cache);

    expect(seen).toHaveLength(1);
    expect(second).toEqual(first);
    const [key = ''] = kept.keys();
    expect(key).toMatch(/^https:\/\/og\.trakt\.tv\/_cache\/match\/[0-9a-f]{64}$/);
    expect(key).not.toContain('viewer');
  });

  it('should keep one copy per viewer', async () => {
    const { cache } = memoryCache();
    await read(cache, 'one');
    await read(cache, 'two');
    expect(seen).toHaveLength(2);
  });

  it("should have none for a private profile the viewer can't see, and keep nothing", async () => {
    status = 403;
    const { kept, cache } = memoryCache();
    expect(await read(cache)).toBeNull();
    expect(kept.size).toBe(0);
  });

  it('should skip the API for a Standard app', async () => {
    vi.mocked(isStandardApi).mockReturnValueOnce(true);
    expect(await read()).toBeNull();
    expect(seen).toHaveLength(0);
  });
});
