import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadPickerLists } from './loadPickerLists.ts';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const target = { type: 'movie', id: 1, title: 'Fight Club' } as const;
const list = (id: number, name: string, privacy: string, slug: string | null) => ({
  ids: { trakt: id, slug: name.toLowerCase().replaceAll(' ', '-') },
  name,
  item_count: 3,
  privacy,
  user: { ids: { trakt: id * 10, slug } },
});
function fixture() {
  let requests = 0;
  server.use(
    http.get('https://apiz.trakt.tv/users/me/lists', () => {
      requests += 1;
      return HttpResponse.json([list(5, 'Mine', 'private', 'justin'), list(6, 'Also mine', 'public', null)]);
    }),
    http.get('https://apiz.trakt.tv/users/me/lists/collaborations', () => {
      requests += 1;
      return HttpResponse.json([list(12, 'Friday films', 'friends', 'friend')]);
    }),
  );
  return () => requests;
}
describe('loadPickerLists', () => {
  it('should load every list with its privacy and owner in two requests, and membership across all pages', async () => {
    const catalogRequests = fixture();
    server.use(
      http.get('https://apiz.trakt.tv/movies/1/listed', ({ request }) => {
        const page = new URL(request.url).searchParams.get('page');
        return HttpResponse.json(
          page === '1'
            ? [{ ids: { trakt: 12 }, type: 'personal' }]
            : [
                { ids: { trakt: null }, type: 'watchlist' },
                { ids: { trakt: 100 }, type: 'favorites' },
              ],
          { headers: { 'X-Pagination-Page-Count': '2' } },
        );
      }),
    );
    const result = await loadPickerLists({ fetch, target });
    expect(catalogRequests()).toBe(2);
    expect(result.watchlisted).toBe(true);
    expect(result.lists).toEqual([
      {
        id: 5,
        name: 'Mine',
        count: 3,
        rank: 1,
        collaboration: false,
        privacy: 'private',
        owner: 'justin',
        selected: false,
      },
      {
        id: 6,
        name: 'Also mine',
        count: 3,
        rank: 2,
        collaboration: false,
        privacy: 'public',
        owner: 'me',
        selected: false,
      },
      {
        id: 12,
        name: 'Friday films',
        count: 3,
        rank: 0,
        collaboration: true,
        privacy: 'friends',
        owner: 'friend',
        selected: true,
      },
    ]);
  });
  it.each(['season', 'episode'] as const)(
    'should read %s list ids and leave the watchlist to the overlay',
    async (type) => {
      fixture();
      server.use(http.get(`https://apiz.trakt.tv/v3/${type}s/1/me/lists`, () => HttpResponse.json([12])));
      const result = await loadPickerLists({ fetch, target: { ...target, type } });
      expect(result.watchlisted).toBeUndefined();
      expect(result.lists.find(({ id }) => id === 12)?.selected).toBe(true);
    },
  );
  it('should fail when the lists do not load instead of silently offering an empty picker', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/users/me/lists', () => new HttpResponse(null, { status: 500 })),
      http.get('https://apiz.trakt.tv/users/me/lists/collaborations', () => HttpResponse.json([])),
      http.get('https://apiz.trakt.tv/movies/1/listed', () => HttpResponse.json([])),
    );
    await expect(loadPickerLists({ fetch, target })).rejects.toThrow();
  });
});
