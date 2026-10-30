import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { api } from '../api/api.ts';
import { fetchRecapSplit } from './fetchRecapSplit.ts';

const API = 'https://apiz.trakt.tv';
const span = { start: '2026-10-01T00:00:00.000Z', end: '2026-10-13T12:00:00.000Z' };
const seen: URL[] = [];

type Pages = { items: number; pages: readonly (readonly number[])[]; fail?: boolean };

// Each page's rows are the trakt ids of the shows or movies played.
const history = ({ episodes, movies }: { episodes: Pages; movies: Pages }) =>
  http.get(`${API}/users/me/history/:type`, ({ request, params }) => {
    const url = new URL(request.url);
    seen.push(url);
    const { items, pages, fail } = params.type === 'episodes' ? episodes : movies;
    if (fail) return new HttpResponse(null, { status: 500 });
    const page = Number(url.searchParams.get('page')) || 1;
    const ids = pages.at(page - 1) ?? [];
    const rows = ids.map((trakt) =>
      params.type === 'episodes' ? { show: { ids: { trakt } } } : { movie: { ids: { trakt } } },
    );
    return HttpResponse.json(rows, {
      headers: { 'X-Pagination-Item-Count': String(items), 'X-Pagination-Page-Count': String(pages.length) },
    });
  });

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const load = () =>
  fetchRecapSplit({ client: api({ fetch: (...args) => globalThis.fetch(...args), token: 'abc' }), span });

describe('fetchRecapSplit', () => {
  it('should split the plays and count the shows and movies across every page', async () => {
    server.use(
      history({
        episodes: {
          items: 5,
          pages: [
            [1, 1, 2],
            [2, 3],
          ],
        },
        movies: { items: 2, pages: [[7, 7]] },
      }),
    );

    expect(await load()).toEqual({
      episodes: { plays: 5, titles: 3 },
      movies: { plays: 2, titles: 1 },
    });
    expect(seen.every((url) => url.searchParams.get('start_at') === span.start)).toBe(true);
    expect(seen.every((url) => url.searchParams.get('end_at') === span.end)).toBe(true);
    expect(seen.every((url) => url.searchParams.get('limit') === '250')).toBe(true);
  });

  it('should count only the plays past four pages', async () => {
    server.use(
      history({
        episodes: { items: 1200, pages: [[1], [2], [3], [4], [5]] },
        movies: { items: 1, pages: [[7]] },
      }),
    );

    expect(await load()).toEqual({
      episodes: { plays: 1200, titles: null },
      movies: { plays: 1, titles: 1 },
    });
    expect(seen.filter((url) => url.pathname.endsWith('/episodes'))).toHaveLength(1);
  });

  it('should fail when a page fails, rather than undercount', async () => {
    server.use(history({ episodes: { items: 1, pages: [[1]] }, movies: { items: 0, pages: [], fail: true } }));

    await expect(load()).rejects.toThrow('A page of history did not load');
  });
});
