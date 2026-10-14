import { http, HttpResponse, type JsonBodyType } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { DashboardSettings } from './DashboardSettings.ts';
import { fetchRecommendations } from './fetchRecommendations.ts';

const BASE = 'https://apiz.trakt.tv';
const now = new Date('2026-10-14T12:00:00Z');
const seen: Request[] = [];
const server = setupServer();
const settings: DashboardSettings['recommendations'] = {
  type: 'media',
  ignoreCollected: false,
};

const media = (id: number, title: string, released: string) => ({
  title,
  year: 2020,
  ids: { trakt: id, slug: `slug-${id}` },
  overview: 'An overview.',
  rating: 8.1,
  runtime: 50,
  certification: 'TV-MA',
  genres: ['science-fiction', 'drama', 'mystery', 'thriller'],
  network: 'HBO',
  first_aired: released,
  released: released.slice(0, 10),
  aired_episodes: 12,
  images: {
    poster: [`media.trakt.tv/images/x/${id}/posters/medium/p.jpg.webp`],
    fanart: [`media.trakt.tv/images/x/${id}/fanarts/medium/f.jpg.webp`],
  },
  colors: { poster: ['#112233', '#445566'] },
});

const rows = [
  {
    show: media(1, 'Severance', '2022-02-18T00:00:00.000Z'),
    score: '0.9',
    sources: [
      { id: 10, type: 'activity', stars: 9, show: media(5, 'Dark', '2017-12-01T00:00:00.000Z') },
      { id: 11, type: 'favorite', stars: null, movie: media(6, 'Alien', '1979-05-25T00:00:00.000Z') },
      {
        id: 12,
        type: 'subgenre',
        stars: null,
        show: media(5, 'Dark', '2017-12-01T00:00:00.000Z'),
        subgenres: [{ id: 1, name: 'Mind-bender', slug: 'mind-bender' }, { id: 2, name: 'Mystery box', slug: 'mb' }],
      },
      {
        id: 13,
        type: 'subgenre',
        stars: null,
        movie: media(6, 'Alien', '1979-05-25T00:00:00.000Z'),
        subgenres: [{ id: 1, name: 'Mind-bender', slug: 'mind-bender' }],
      },
    ],
  },
  { movie: media(3, 'Soon', '2027-01-01T00:00:00.000Z'), score: 0.5, sources: [] },
];

const respond = (path: string, body: JsonBodyType = rows) =>
  http.get(`${BASE}${path}`, ({ request }) => {
    seen.push(request);
    return HttpResponse.json(body);
  });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const load = (overrides: Partial<DashboardSettings['recommendations']> = {}) =>
  fetchRecommendations({
    fetch: (...args) => globalThis.fetch(...args),
    token: 'abc',
    settings: { ...settings, ...overrides },
    now,
  });

describe('fetchRecommendations', () => {
  it('should load shows and movies together with their images, colors and sources', async () => {
    server.use(respond('/media/recommendations'));

    const recs = await load();
    const url = new URL(seen.at(0)?.url ?? '');

    expect(url.searchParams.get('extended')).toBe('full,images,colors');
    expect(url.searchParams.get('limit')).toBe('50');
    expect(url.searchParams.get('ignore_watched')).toBe('true');
    expect(url.searchParams.get('hide_watching')).toBe('true');
    expect(url.searchParams.get('ignore_watchlisted')).toBe('true');
    expect(url.searchParams.has('ignore_collected')).toBe(false);
    expect(seen.at(0)?.headers.get('authorization')).toBe('Bearer abc');
    expect(recs.type).toBe('media');
    expect(recs.items?.map(({ type, href, released }) => ({ type, href, released }))).toEqual([
      { type: 'show', href: '/shows/slug-1', released: true },
      { type: 'movie', href: '/movies/slug-3', released: false },
    ]);
  });

  it('should map the spotlight details', async () => {
    server.use(respond('/media/recommendations'));

    const item = (await load()).items?.at(0);

    expect(item).toMatchObject({
      path: '/shows/1',
      genres: ['Science fiction', 'Drama', 'Mystery'],
      network: 'HBO',
      certification: 'TV-MA',
      fanart: 'https://media.trakt.tv/images/x/1/fanarts/medium/f.jpg.webp',
      colors: ['#112233', '#445566'],
    });
  });

  it('should group the sources as watched, loved and liked subgenres', async () => {
    server.use(respond('/media/recommendations'));

    const why = (await load()).items?.at(0)?.why;

    expect(why?.titles.map(({ title, stars, watched, loved }) => ({ title, stars, watched, loved }))).toEqual([
      { title: 'Dark', stars: 9, watched: true, loved: false },
      { title: 'Alien', stars: undefined, watched: false, loved: true },
    ]);
    expect(why?.titles.at(1)?.href).toBe('/movies/slug-6');
    expect(why?.likes).toEqual(['Mind-bender', 'Mystery box']);
  });

  it('should merge a title watched and loved into one, keeping the rating', async () => {
    const sources = [
      { id: 1, type: 'activity', stars: 10, show: media(7, 'Superstore', '2015-11-30T00:00:00.000Z') },
      { id: 2, type: 'favorite', stars: null, show: media(7, 'Superstore', '2015-11-30T00:00:00.000Z') },
    ];
    server.use(respond('/media/recommendations', [{ ...rows[0], sources }]));

    const titles = (await load()).items?.at(0)?.why.titles;

    expect(titles?.map(({ title, stars, watched, loved }) => ({ title, stars, watched, loved }))).toEqual([
      { title: 'Superstore', stars: 10, watched: true, loved: true },
    ]);
  });

  it("should load one type from its own route with the viewer's library switch", async () => {
    server.use(respond('/movies/recommendations', [rows[1]]));

    const recs = await load({ type: 'movie', ignoreCollected: true });
    const url = new URL(seen.at(0)?.url ?? '');

    expect(url.searchParams.get('ignore_collected')).toBe('true');
    expect(recs).toMatchObject({ type: 'movie', items: [{ title: 'Soon' }] });
  });

  it('should come back without items when the request fails or the body is unreadable', async () => {
    server.use(http.get(`${BASE}/shows/recommendations`, () => new HttpResponse(null, { status: 500 })));
    expect(await load({ type: 'show' })).toEqual({ type: 'show', items: null });

    server.use(respond('/shows/recommendations', { nope: true }));
    expect(await load({ type: 'show' })).toEqual({ type: 'show', items: null });
  });
});
