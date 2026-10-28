import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { handleFetch } from './hooks.server.ts';
import { isApiRateLimited } from './lib/api/isApiRateLimited.ts';
import { rateLimitPause } from './lib/api/rateLimitPause.ts';

vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_TRAKT_API: 'standard' } }));

const API = 'https://api.trakt.tv';
const sent: string[] = [];
const server = setupServer(
  http.get(`${API}/users/me`, ({ request }) => {
    sent.push(new URL(request.url).pathname);
    return new HttpResponse('error code: 1015', { status: 429, headers: { 'retry-after': '120' } });
  }),
  http.get(`${API}/users/me/history`, ({ request }) => {
    sent.push(new URL(request.url).pathname);
    return HttpResponse.json([]);
  }),
  http.get(`${API}/movies/trending`, ({ request }) => {
    sent.push(new URL(request.url).pathname);
    return HttpResponse.json([], { headers: { 'cache-control': 'public, max-age=600' } });
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  sent.length = 0;
  rateLimitPause.start('0', 0);
});
afterAll(() => server.close());

type FetchEvent = Parameters<typeof handleFetch>[0];
const serverFetch = async (url: string, event: object = {}) =>
  handleFetch({
    event,
    request: new Request(url),
    fetch: (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args),
  } as unknown as FetchEvent);

describe('hooks: a Standard app after a 429', () => {
  it('should hold the next reads without sending them, saying how long is left', async () => {
    await serverFetch(`${API}/users/me`).catch(() => null);

    const failure: unknown = await serverFetch(`${API}/users/me/history`).catch((cause: unknown) => cause);

    expect(isApiRateLimited(failure)).toBe(true);
    expect(sent).toEqual(['/users/me']);
  });

  it('should still answer a read the data center keeps', async () => {
    const kept = new Map<string, Response>();
    const cache = {
      match: (key: string) => Promise.resolve(kept.get(key)?.clone()),
      put: (key: string, response: Response) => Promise.resolve(void kept.set(key, response)),
    };
    const writes: Promise<unknown>[] = [];
    const event = {
      locals: { token: null, tokenExpired: false },
      platform: { caches: { default: cache }, ctx: { waitUntil: (write: Promise<unknown>) => writes.push(write) } },
      url: new URL('https://og.trakt.tv/movies/trending'),
    };
    await serverFetch(`${API}/movies/trending`, event);
    await Promise.all(writes);
    await serverFetch(`${API}/users/me`).catch(() => null);

    expect((await serverFetch(`${API}/movies/trending`, event)).status).toBe(200);
    expect(sent).toEqual(['/movies/trending', '/users/me']);
  });

  it('should send reads again once Retry-After runs out', async () => {
    rateLimitPause.start('1', Date.now() - 2_000);

    expect((await serverFetch(`${API}/users/me/history`)).status).toBe(200);
  });
});
