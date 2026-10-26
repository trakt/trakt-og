import { isHttpError, isRedirect } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadSearch } from './loadSearch.ts';

const SHOW = { title: 'Breaking Bad', year: 2008, ids: { trakt: 1388, slug: 'breaking-bad' } };
const seen: Request[] = [];
const server = setupServer(
  http.get('https://apiz.trakt.tv/search/:type', ({ request }) => {
    seen.push(request);
    if (request.headers.get('authorization') === 'Bearer stale') return new HttpResponse(null, { status: 401 });
    return HttpResponse.json([{ score: 1, type: 'show', show: SHOW }], {
      headers: { 'X-Pagination-Page': '2', 'X-Pagination-Page-Count': '3', 'X-Pagination-Item-Count': '80' },
    });
  }),
  http.get('https://apiz.trakt.tv/search/:idType/:id', ({ params }) =>
    HttpResponse.json(params.id === 'tt0903747' ? [{ score: 1, type: 'show', show: SHOW }] : []),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const search = (path: string, { settings = null, ...extra }: { type?: string; id?: string; settings?: unknown } = {}) =>
  loadSearch({
    fetch: (input, init) => {
      expect(new Headers(init?.headers).get('authorization')).toBeNull();
      return globalThis.fetch(input, init);
    },
    cookies: { get: () => undefined },
    parent: () => Promise.resolve({ datePreferences: { order: 'mdy' }, settings }),
    url: new URL(`https://og.test${path}`),
    ...extra,
  });

const thrownBy = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (thrown: unknown) => (isRedirect(thrown) ? thrown.location : isHttpError(thrown) ? thrown.status : thrown),
  );

describe('loadSearch', () => {
  it('should ask for 36 a page without the viewer token and read the paging headers', async () => {
    const data = await search('/search/shows?q=breaking&page=2', { type: 'shows' });

    const url = new URL(seen.at(0)?.url ?? '');
    expect(url.pathname).toBe('/search/show');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ query: 'breaking', page: '2', limit: '36' });
    expect(seen.at(0)?.headers.get('authorization')).toBeNull();
    expect(data.query).toBe('breaking');
    expect(data.page).toEqual({ type: 'paginated', current: 2, total: 3 });
    expect(data.count).toBe(80);
  });

  it('should cap public search limits at 50', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/search/:type', ({ request }) => {
        seen.push(request);
        return HttpResponse.json([{ type: 'show', show: SHOW }], {
          headers: {
            'X-Pagination-Page': '1',
            'X-Pagination-Page-Count': '1',
            'X-Pagination-Item-Count': '50',
          },
        });
      }),
    );
    const data = await search('/search?query=breaking&limit=80');
    expect(new URL(seen.at(0)?.url ?? '').searchParams.get('limit')).toBe('50');

    expect(seen.map((request) => request.headers.get('authorization'))).toEqual([null]);
    expect(data.page).toEqual({ type: 'paginated', current: 1, total: 1 });
  });

  const viewerSearch = (token: string, path = '/search/shows?query=breaking&hide=watched,watchlist,rated') =>
    loadSearch({
      fetch: globalThis.fetch,
      token,
      cookies: { get: () => undefined },
      parent: () => Promise.resolve({ datePreferences: { order: 'mdy' } }),
      url: new URL(`https://og.test${path}`),
      type: path.includes('/shows') ? 'shows' : undefined,
    });

  it('should send hide and the viewer token only for a typed Hide search', async () => {
    const data = await viewerSearch('viewer');
    expect(new URL(seen.at(0)?.url ?? '').searchParams.get('hide')).toBe('watched,watchlist,rated');
    expect(seen.at(0)?.headers.get('authorization')).toBe('Bearer viewer');
    expect(data.filters.fadeHide.hide).toEqual(['watched', 'watchlisted', 'rated']);
  });

  it('should keep a mixed search public even with a token and saved Hide', async () => {
    await viewerSearch('stale', '/search?query=the&hide=watched');
    expect(seen.at(0)?.headers.get('authorization')).toBeNull();
    expect(new URL(seen.at(0)?.url ?? '').searchParams.has('hide')).toBe(false);
  });

  it('should fall back to public search after a viewer Hide request returns 401', async () => {
    const data = await viewerSearch('stale');
    expect(seen.map((request) => request.headers.get('authorization'))).toEqual(['Bearer stale', null]);
    expect(new URL(seen.at(1)?.url ?? '').searchParams.has('hide')).toBe(false);
    expect(data.cards.at(0)?.title).toBe('Breaking Bad');
    expect(data.filters.fadeHide.hide).toEqual(['watched', 'watchlisted', 'rated']);
  });

  it('should validate API Hide results before mapping them', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/search/:type', () =>
        HttpResponse.json([{ type: 'show', show: { title: 'Bad' } }], { headers: { 'X-Runtime': '0.01' } }),
      ),
    );
    expect(await thrownBy(viewerSearch('viewer'))).toBe(502);
  });

  it("should start the Display on the profile's search image type, and posters signed out", async () => {
    const settings = { browsing: { search: { image_type: 'logo' } } };
    expect((await search('/search?query=breaking', { settings })).display).toEqual({ view: 'grid', artwork: 'logo' });
    expect((await search('/search?query=breaking')).display).toEqual({ view: 'grid', artwork: 'poster' });
  });

  it('should take the query from the path', async () => {
    const data = await search('/search/shows/breaking', { type: 'shows', id: 'breaking' });
    expect(data.query).toBe('breaking');
  });

  it('should show the empty state for a blank query without calling the API', async () => {
    expect((await search('/search?query=%20')).cards).toEqual([]);
    expect(seen).toEqual([]);
  });

  it('should send a retired tab to Shows & Movies with its query', async () => {
    expect(await thrownBy(search('/search/episodes?query=pilot', { type: 'episodes' }))).toBe('/search?query=pilot');
    expect(await thrownBy(search('/search/users/sean', { type: 'users', id: 'sean' }))).toBe('/search?query=sean');
    expect(await thrownBy(search('/search/users', { type: 'users' }))).toBe('/search');
    expect(seen).toEqual([]);
  });

  it('should redirect an ID with one match straight to it', async () => {
    expect(await thrownBy(search('/search/imdb?query=tt0903747', { type: 'imdb' }))).toBe('/shows/breaking-bad');
    expect((await search('/search/imdb?query=tt0', { type: 'imdb' })).idMode).toBe(true);
  });

  it('should reject malformed successful responses at the boundary', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/search/:type', () =>
        HttpResponse.json([{ type: 'show', show: { title: 'Bad' } }]),
      ),
    );
    expect(await thrownBy(search('/search?query=bad'))).toBe(502);
  });

  it('should turn an API failure into a 502', async () => {
    server.use(http.get('https://apiz.trakt.tv/search/:type', () => new HttpResponse(null, { status: 500 })));
    expect(await thrownBy(search('/search?query=bad'))).toBe(502);
  });

  it('should 404 an unknown tab', async () => {
    expect(await thrownBy(search('/search/nope?query=a', { type: 'nope' }))).toBe(404);
  });
});
