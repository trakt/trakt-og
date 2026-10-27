import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchListUrls } from './fetchListUrls.ts';

const API = 'https://apiz.trakt.tv';
const seen: URL[] = [];

const row = (type: 'official' | 'personal', trakt: number) => ({
  like_count: 1,
  comment_count: 0,
  list: {
    type,
    privacy: 'public',
    updated_at: '2026-10-20T07:46:07.000Z',
    ids: { trakt, slug: `list-${trakt}` },
    user: { username: 'Sean', private: false, deleted: false, ids: { slug: type === 'official' ? null : 'sean' } },
  },
});

const lists = (path: string, rows: unknown[], status = 200) =>
  http.get(`${API}/lists${path}`, ({ request }) => {
    seen.push(new URL(request.url));
    return HttpResponse.json(status === 200 ? rows : null, { status, headers: { 'X-Pagination-Page-Count': '1' } });
  });

const fetch = (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args);
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

describe('fetchListUrls', () => {
  it('should list popular official lists, then popular and trending community lists, once each', async () => {
    server.use(
      lists('/popular/official', [row('official', 1)]),
      lists('/popular/personal', [row('personal', 2)]),
      lists('/trending/personal', [row('personal', 3), row('personal', 2)]),
    );

    expect(await fetchListUrls({ fetch })).toEqual([
      { path: '/lists/official/list-1', lastmod: '2026-10-20T07:46:07Z' },
      { path: '/users/sean/lists/list-2', lastmod: '2026-10-20T07:46:07Z' },
      { path: '/users/sean/lists/list-3', lastmod: '2026-10-20T07:46:07Z' },
    ]);
    expect(seen.every((url) => url.searchParams.get('limit') === '250')).toBe(true);
  });

  it('should give null when any source fails', async () => {
    server.use(
      lists('/popular/official', [row('official', 1)]),
      lists('/popular/personal', [], 500),
      lists('/trending/personal', [row('personal', 3)]),
    );

    expect(await fetchListUrls({ fetch })).toBeNull();
  });
});
