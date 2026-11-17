import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchListStats } from './fetchListStats.ts';
import type { ListQuery } from './ListQuery.ts';

const API = 'https://apiz.trakt.tv';
const BASE = '/users/sean/lists/heist-night/items';
const query: ListQuery = { types: ['movie'], genres: [], page: 1, limit: 120 };
const pages: URL[] = [];

const movie = (id: number) => ({
  type: 'movie',
  rank: id,
  id: 100 + id,
  listed_at: '2026-01-02T00:00:00.000Z',
  notes: null,
  movie: { title: `Movie ${id}`, ids: { trakt: id, slug: `movie-${id}` } },
});

const server = setupServer(
  http.get(`${API}${BASE}/*`, ({ request }) => {
    const url = new URL(request.url);
    pages.push(url);
    const page = Number(url.searchParams.get('page'));
    const limit = Number(url.searchParams.get('limit'));
    const first = (page - 1) * limit + 1;
    return HttpResponse.json(
      Array.from({ length: Math.max(0, Math.min(limit, 600 - first + 1)) }, (_, i) => movie(first + i)),
    );
  }),
);
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  pages.length = 0;
});
afterAll(() => server.close());

const run = (params: Partial<Parameters<typeof fetchListStats>[0]> = {}) =>
  fetchListStats({ fetch, base: BASE, query, total: 600, withItems: true, ...params });

describe('fetchListStats', () => {
  it('should count every page of the list, in rank order', async () => {
    const stats = await run();

    expect(stats).toMatchObject({ count: 600, runtime: 600 * 90 });
    expect(stats?.items).toHaveLength(600);
    expect(pages.map((url) => `${url.pathname}?${url.searchParams}`)).toEqual(
      [1, 2, 3].map((page) => `${BASE}/movie/rank/asc?extended=full&page=${page}&limit=250`),
    );
  });

  it('should leave out the ids when the viewer is signed out', async () => {
    expect((await run({ withItems: false }))?.items).toBeUndefined();
  });

  it('should return null for a list past the cap, without reading it', async () => {
    expect(await run({ total: 250 * 20 + 1 })).toBeNull();
    expect(pages).toHaveLength(0);
  });

  it('should return null when a page fails', async () => {
    server.use(http.get(`${API}${BASE}/*`, () => new HttpResponse(null, { status: 500 })));

    expect(await run()).toBeNull();
  });

  it('should read through the fetch it is given, for the viewer to sign in with', async () => {
    const calls: string[] = [];
    const signedIn: typeof fetch = (input, init) => {
      calls.push(String(input instanceof Request ? input.url : input));
      return fetch(input, init);
    };
    await run({ fetch: signedIn, total: 600 });

    expect(calls).toHaveLength(3);
  });
});
