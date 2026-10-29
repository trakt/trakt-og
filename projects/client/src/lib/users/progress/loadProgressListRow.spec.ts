import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { toProfileUser } from '../toProfileUser.ts';
import { loadProgressListRow } from './loadProgressListRow.ts';

const API = 'https://apiz.trakt.tv';
const profile = toProfileUser({ username: 'tester', name: 'Tester', private: false, ids: { slug: 'tester' } });
const seen: { url: string; token: string | null }[] = [];
const record = (request: Request) =>
  seen.push({ url: new URL(request.url).pathname, token: request.headers.get('authorization') });

const list = {
  name: 'Heist Night',
  description: 'Crews, vaults and one last job.',
  privacy: 'private',
  share_link: '',
  type: 'personal',
  display_numbers: false,
  allow_comments: true,
  sort_by: 'rank',
  sort_how: 'asc',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  item_count: 12,
  comment_count: 3,
  likes: 4,
  ids: { trakt: 42, slug: 'heist-night' },
  user: { username: 'sean', private: false, ids: { slug: 'sean' } },
  images: { posters: ['media.trakt.tv/heat.jpg'] },
};
const items = [{ type: 'show', show: { title: 'Severance', images: { poster: ['media.trakt.tv/sev.jpg'] } } }];

const server = setupServer(
  http.get(`${API}/lists/42`, ({ request }) => {
    record(request);
    return request.headers.get('authorization') ? HttpResponse.json(list) : new HttpResponse(null, { status: 404 });
  }),
  http.get(`${API}/users/:id/watchlist/movie,show,season,episode/rank/asc`, ({ request }) => {
    record(request);
    return HttpResponse.json(items, { headers: { 'X-Pagination-Item-Count': '87' } });
  }),
  http.get(`${API}/users/morbus`, ({ request }) => {
    record(request);
    return HttpResponse.json({ username: 'morbus', name: 'Morbus Iff', private: false, ids: { slug: 'morbus' } });
  }),
  http.get(`${API}/users/hidden`, () => new HttpResponse(null, { status: 404 })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const load = (value: Parameters<typeof loadProgressListRow>[0]['list'], token: string | null = 'token') =>
  loadProgressListRow({ fetch, token, list: value, profile });

describe('loadProgressListRow', () => {
  it('should read a personal list public first, then with the token', async () => {
    const row = await load({ kind: 'personal', id: 42, base: '/lists/42/items' });

    expect(row).toMatchObject({ id: 42, kind: 'personal', name: 'Heist Night', itemCount: 12, pills: ['Private'] });
    expect(row?.owner.slug).toBe('sean');
    expect(seen.map(({ token }) => token)).toEqual([null, 'Bearer token']);
  });

  it("should leave out a personal list the viewer can't read", async () => {
    expect(await load({ kind: 'personal', id: 42, base: '/lists/42/items' }, null)).toBeNull();
  });

  it('should build your own watchlist from its items and your profile', async () => {
    const row = await load({ kind: 'watchlist', owner: 'tester', base: '/users/tester/watchlist' });

    expect(row).toMatchObject({ kind: 'watchlist', name: 'Watchlist', href: '/users/tester/watchlist', itemCount: 87 });
    expect(row?.owner.name).toBe('Tester');
    expect(seen.map(({ url }) => url)).toEqual(['/users/tester/watchlist/movie,show,season,episode/rank/asc']);
  });

  it("should read the owner of someone else's watchlist", async () => {
    const row = await load({ kind: 'watchlist', owner: 'morbus', base: '/users/morbus/watchlist' });

    expect(row?.owner).toMatchObject({ slug: 'morbus', name: 'Morbus Iff', href: '/users/morbus' });
  });

  it("should leave out a watchlist whose owner can't be read", async () => {
    expect(await load({ kind: 'watchlist', owner: 'hidden', base: '/users/hidden/watchlist' })).toBeNull();
  });
});
