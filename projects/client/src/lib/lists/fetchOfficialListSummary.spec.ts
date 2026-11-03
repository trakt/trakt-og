import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchOfficialListSummary } from './fetchOfficialListSummary.ts';

const API = 'https://apiz.trakt.tv';
const SLUG = '1001-movies-you-must-see-before-you-die';
const seen: URL[] = [];

const list = (type: 'official' | 'personal', trakt: number, slug = SLUG) => ({
  name: '1001 Movies You Must See Before You Die',
  description: '',
  privacy: 'public',
  share_link: '',
  type,
  display_numbers: true,
  allow_comments: true,
  sort_by: 'rank',
  sort_how: 'asc',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  item_count: 1001,
  comment_count: 0,
  likes: 0,
  ids: { trakt, slug },
  user: { username: type === 'official' ? 'Trakt' : 'sp1ti', private: false, ids: { slug: null } },
});
const official = list('official', 37675689);
const personal = list('personal', 805405);
const hit = (row: ReturnType<typeof list>) => ({ type: 'list', score: 1, list: row });

const byId = new Map<string, ReturnType<typeof list>>([
  [SLUG, personal],
  ['37675689', official],
  ['805405', personal],
  ['heat-collection', list('official', 9, 'heat-collection')],
]);

const server = setupServer(
  http.get(`${API}/lists/:id`, ({ request, params }) => {
    seen.push(new URL(request.url));
    const row = byId.get(String(params.id));
    return row ? HttpResponse.json(row) : new HttpResponse(null, { status: 204 });
  }),
  http.get(`${API}/search/list`, ({ request }) => {
    seen.push(new URL(request.url));
    return HttpResponse.json([hit(list('personal', 1, `${SLUG}-copy`)), hit(personal), hit(official)]);
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const read = (id: string) => fetchOfficialListSummary({ fetch, id });

describe('fetchOfficialListSummary', () => {
  it('should read an official list by its slug alone', async () => {
    const found = await read('heat-collection');

    expect(found?.status === 200 && found.body.ids.trakt).toBe(9);
    expect(seen.map(({ pathname }) => pathname)).toEqual(['/lists/heat-collection']);
  });

  it('should find the official list by name when its slug opens a personal list', async () => {
    const found = await read(SLUG);

    expect(found?.status === 200 && found.body.type).toBe('official');
    expect(found?.status === 200 && found.body.ids.trakt).toBe(37675689);
    expect(seen.map(({ pathname }) => pathname)).toEqual([`/lists/${SLUG}`, '/search/list', '/lists/37675689']);
    expect(seen.at(1)?.searchParams.get('query')).toBe('1001 movies you must see before you die');
  });

  it('should keep the personal list when search has no official list for the slug', async () => {
    server.use(http.get(`${API}/search/list`, () => HttpResponse.json([hit(personal)])));

    const found = await read(SLUG);

    expect(found?.status === 200 && found.body.type).toBe('personal');
  });

  it('should keep the personal list when search fails', async () => {
    server.use(http.get(`${API}/search/list`, () => new HttpResponse(null, { status: 500 })));

    const found = await read(SLUG);

    expect(found?.status === 200 && found.body.type).toBe('personal');
  });

  it('should not search for a Trakt id', async () => {
    const found = await read('805405');

    expect(found?.status === 200 && found.body.type).toBe('personal');
    expect(seen.map(({ pathname }) => pathname)).toEqual(['/lists/805405']);
  });

  it('should pass a missing list through', async () => {
    expect((await read('missing'))?.status).toBe(204);
    expect(seen).toHaveLength(1);
  });
});
