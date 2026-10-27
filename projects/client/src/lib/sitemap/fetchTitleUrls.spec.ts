import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchTitleUrls } from './fetchTitleUrls.ts';

const API = 'https://apiz.trakt.tv';
const seen: URL[] = [];

const movie = (slug: string) => ({
  title: slug,
  year: 2026,
  ids: { trakt: 1, slug },
  updated_at: '2026-10-26T08:05:55.000Z',
});

// One page of rows for `path`, with the page count the API sends.
const paged = (path: string, pages: Record<number, unknown[]>, status = 200) =>
  http.get(`${API}${path}`, ({ request }) => {
    const url = new URL(request.url);
    seen.push(url);
    const rows = pages[Number(url.searchParams.get('page'))] ?? [];
    return HttpResponse.json(status === 200 ? rows : { error: 'down' }, {
      status,
      headers: { 'X-Pagination-Page-Count': `${Object.keys(pages).length}` },
    });
  });

const fetch = (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args);
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

describe('fetchTitleUrls', () => {
  it("should list what's popular, then the most watched of all time, once each, dated by updated_at", async () => {
    server.use(
      paged('/movies/popular', { 1: [movie('a')], 2: [movie('b')] }),
      paged('/movies/watched/all', {
        1: [
          { watcher_count: 9, movie: movie('b') },
          { watcher_count: 8, movie: movie('c') },
        ],
      }),
    );

    expect(await fetchTitleUrls({ fetch, type: 'movies' })).toEqual([
      { path: '/movies/a', lastmod: '2026-10-26T08:05:55Z' },
      { path: '/movies/b', lastmod: '2026-10-26T08:05:55Z' },
      { path: '/movies/c', lastmod: '2026-10-26T08:05:55Z' },
    ]);
    expect(seen.every((url) => url.searchParams.get('extended') === 'full')).toBe(true);
    expect(seen.every((url) => url.searchParams.get('limit') === '250')).toBe(true);
  });

  it('should read shows from the show charts', async () => {
    server.use(
      paged('/shows/popular', { 1: [movie('severance')] }),
      paged('/shows/watched/all', { 1: [{ watcher_count: 1, show: movie('the-office') }] }),
    );

    const urls = await fetchTitleUrls({ fetch, type: 'shows' });
    expect(urls?.map(({ path }) => path)).toEqual(['/shows/severance', '/shows/the-office']);
  });

  it('should read at most 8 pages of each chart', async () => {
    const pages = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, [movie(`m-${i}`)]]));
    server.use(paged('/movies/popular', pages), paged('/movies/watched/all', { 1: [] }));

    await fetchTitleUrls({ fetch, type: 'movies' });
    expect(seen.filter(({ pathname }) => pathname === '/movies/popular')).toHaveLength(8);
  });

  it('should give null when either chart fails', async () => {
    server.use(paged('/movies/popular', { 1: [movie('a')] }), paged('/movies/watched/all', { 1: [] }, 503));

    expect(await fetchTitleUrls({ fetch, type: 'movies' })).toBeNull();
  });
});
