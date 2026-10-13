import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createLiveNow } from './fetchLiveNow.ts';

const seen: URL[] = [];
// Each page's count is the sum of its own rows, like the API's.
const trending = (type: 'shows' | 'movies', items: number, pages: Record<number, { users: number; rows: unknown[] }>) =>
  http.get(`https://apiz.trakt.tv/${type}/trending`, ({ request }) => {
    const url = new URL(request.url);
    seen.push(url);
    const page = pages[Number(url.searchParams.get('page'))] ?? { users: 0, rows: [] };
    return HttpResponse.json(page.rows, {
      headers: { 'X-Trending-User-Count': `${page.users}`, 'X-Pagination-Item-Count': `${items}` },
    });
  });
const SHOW = { title: 'Ted Lasso', year: 2020, ids: { trakt: 1, slug: 'ted-lasso' } };
const MOVIE = { title: 'Weapons', year: 2025, ids: { trakt: 2, slug: 'weapons-2025' } };
const fetch = (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args);

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const bothCharts = () =>
  server.use(
    trending('shows', 600, {
      1: { users: 150_000, rows: [{ watchers: 8762, show: SHOW }] },
      2: { users: 30_000, rows: [] },
      3: { users: 3000, rows: [] },
    }),
    trending('movies', 190, { 1: { users: 25_187, rows: [{ watchers: 410, movie: MOVIE }] } }),
  );

describe('fetchLiveNow', () => {
  it('should add up every page of both charts, since the API only counts the rows it sends', async () => {
    bothCharts();

    expect(await createLiveNow()(fetch)).toEqual({ shows: 183_000, movies: 25_187 });
    const shows = seen.filter((url) => url.pathname === '/shows/trending');
    expect(shows.map((url) => url.searchParams.get('page'))).toEqual(['1', '2', '3']);
    expect(seen.every((url) => url.searchParams.get('limit') === '250')).toBe(true);
  });

  it('should keep the answer for 5 minutes', async () => {
    bothCharts();
    const liveNow = createLiveNow();

    await liveNow(fetch, 0);
    const asked = seen.length;
    await liveNow(fetch, 4 * 60_000);
    expect(seen).toHaveLength(asked);

    await liveNow(fetch, 5 * 60_000);
    expect(seen).toHaveLength(asked * 2);
  });

  it('should count an empty chart as nobody', async () => {
    server.use(trending('shows', 0, {}), trending('movies', 0, {}));

    expect(await createLiveNow()(fetch)).toEqual({ shows: 0, movies: 0 });
  });

  it('should give nothing when one chart fails, and ask again next time', async () => {
    server.use(
      trending('shows', 1, { 1: { users: 8762, rows: [{ watchers: 8762, show: SHOW }] } }),
      http.get('https://apiz.trakt.tv/movies/trending', () => new HttpResponse(null, { status: 502 })),
    );
    const liveNow = createLiveNow();

    expect(await liveNow(fetch, 0)).toBeNull();
    await liveNow(fetch, 1);
    expect(seen.filter((url) => url.pathname === '/shows/trending')).toHaveLength(2);
  });
});
