import { env } from 'cloudflare:workers';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { liveConfig } from './liveConfig.ts';
import { liveSocket } from './liveSocket.ts';

let director = true;
const server = setupServer(
  http.get('https://apiz.trakt.tv/users/settings', () =>
    HttpResponse.json({ user: { username: 'sean', vip: true, director, ids: { slug: 'sean' } } }),
  ),
);
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  director = true;
  env.WATCHING_NOW_LIVE = undefined;
});
afterAll(() => server.close());

const forwarded: Request[] = [];
const refresher = (answer: () => Promise<Response>): DurableObjectNamespace => ({
  idFromName: (name) => ({ toString: () => name }),
  get: () => ({
    fetch: (request) => {
      forwarded.push(request);
      return answer();
    },
  }),
});

const event = (upgrade = true, origin: string | null = 'https://og.trakt.tv') => {
  const url = new URL('https://og.trakt.tv/live/socket');
  return {
    request: new Request(url, {
      headers: { ...(upgrade && { upgrade: 'websocket' }), ...(origin !== null && { origin }) },
    }),
    fetch,
    url,
    cookies: { get: () => undefined },
  };
};

describe('liveSocket', () => {
  it('should answer 426 to a request that is not a socket', async () => {
    expect((await liveSocket({ event: event(false), token: 'token' })).status).toBe(426);
  });

  it("should answer 403 to a socket opened from another site, even a director's", async () => {
    forwarded.length = 0;
    env.WATCHING_NOW_LIVE = refresher(async () => new Response('live'));

    expect((await liveSocket({ event: event(true, 'https://evil.example'), token: 'token' })).status).toBe(403);
    expect(forwarded).toHaveLength(0);
  });

  it('should answer 403 to a socket with no origin', async () => {
    env.WATCHING_NOW_LIVE = refresher(async () => new Response('live'));

    expect((await liveSocket({ event: event(true, null), token: 'token' })).status).toBe(403);
  });

  it('should answer 401 to a guest', async () => {
    expect((await liveSocket({ event: event(), token: null })).status).toBe(401);
  });

  it("should answer 503 where there's no refresher, like vite dev", async () => {
    expect((await liveSocket({ event: event(), token: 'token' })).status).toBe(503);
  });

  it('should answer 403 to a member who is not a director', async () => {
    director = false;
    env.WATCHING_NOW_LIVE = refresher(async () => new Response('live'));

    expect((await liveSocket({ event: event(), token: 'token' })).status).toBe(403);
  });

  it("should pass a director's socket on with og's API settings", async () => {
    forwarded.length = 0;
    env.WATCHING_NOW_LIVE = refresher(async () => new Response('live'));
    const response = await liveSocket({ event: event(), token: 'token' });

    expect(await response.text()).toBe('live');
    expect(liveConfig.read(forwarded.at(0)?.headers ?? new Headers())?.environment).toMatch(/^https:\/\//);
  });

  it("should answer 503 when the refresher can't be reached", async () => {
    env.WATCHING_NOW_LIVE = refresher(() => Promise.reject(new Error('down')));

    expect((await liveSocket({ event: event(), token: 'token' })).status).toBe(503);
  });
});
