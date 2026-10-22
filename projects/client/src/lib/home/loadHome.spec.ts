import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { createTtlCache } from '../utils/createTtlCache.ts';
import { homeFanartTitles } from './homeFanartTitles.ts';
import type { KeyedCache } from '../utils/sharedCache.ts';
import { loadHome } from './loadHome.ts';
import type { HomeTrending } from './live/fetchHomeTrending.ts';
import type { HomeLive } from './live/toHomeLive.ts';
import type { HomeFanart } from './toHomeFanarts.ts';

const summary = (type: string, slug: string) => ({
  title: `Title ${slug}`,
  year: 2010,
  ids: { trakt: 1, slug },
  images: { fanart: [`media.trakt.tv/images/${type}/${slug}/fanarts/medium/a.jpg.webp`] },
});

const trendingRow = (type: string, slug: string) => ({
  watchers: 10,
  [type === 'shows' ? 'show' : 'movie']: { title: `Trending ${slug}`, year: 2026, ids: { trakt: 1, slug } },
});

const seen: Request[] = [];
const server = setupServer(
  http.get(
    'https://apiz.trakt.tv/:type/trending',
    ({ params }) =>
      HttpResponse.json([trendingRow(String(params.type), 'one'), trendingRow(String(params.type), 'two')]),
  ),
  http.get(
    'https://apiz.trakt.tv/:type/:slug/watching',
    ({ params }) =>
      HttpResponse.json([{ username: `${params.type}-${params.slug}`, private: false, location: 'Brazil' }]),
  ),
  http.get('https://apiz.trakt.tv/:type/:slug', ({ request, params }) => {
    seen.push(request);
    return HttpResponse.json(summary(String(params.type), String(params.slug)));
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const freshPool = () => createTtlCache<HomeFanart[]>({ ttlMs: 1000, retryMs: 100 });
const fresh = () => ({
  pool: freshPool(),
  trendingPool: createTtlCache<HomeTrending>({ ttlMs: 1000, retryMs: 100 }),
  livePool: createTtlCache<HomeLive>({ ttlMs: 1000, retryMs: 100 }),
});
const parent = (user: HeaderUser | null = null) => () => Promise.resolve({ user });

describe('loadHome', () => {
  it('should read every hand-picked title without a token and return them all', async () => {
    const data = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), ...fresh() });

    expect(data.fanarts.map(({ key }) => key).toSorted()).toEqual(
      homeFanartTitles.map(({ type, slug }) => `${type}-${slug}`).toSorted(),
    );
    expect(seen).toHaveLength(homeFanartTitles.length);
    expect(seen.every((request) => !request.headers.has('authorization'))).toBe(true);
    expect(data.signedIn).toBe(false);
  });

  it('should shuffle with the random numbers it is given', async () => {
    const pool = freshPool();
    const first = await loadHome({ fetch, now: 0, random: () => 0, parent: parent(), pool });
    const last = await loadHome({ fetch, now: 1, random: () => 0.999, parent: parent(), pool });

    expect(first.fanarts.map(({ key }) => key)).not.toEqual(last.fanarts.map(({ key }) => key));
  });

  it('should reuse the cached titles for the next visit', async () => {
    const pool = freshPool();
    await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), pool });
    await loadHome({ fetch, now: 500, random: Math.random, parent: parent(), pool });

    expect(seen).toHaveLength(homeFanartTitles.length);
  });

  it('should drop a title whose summary fails', async () => {
    server.use(http.get('https://apiz.trakt.tv/shows/fringe', () => new HttpResponse(null, { status: 404 })));
    const data = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), ...fresh() });

    expect(data.fanarts).toHaveLength(homeFanartTitles.length - 1);
    expect(data.fanarts.some(({ key }) => key === 'show-fringe')).toBe(false);
  });

  it('should say when the viewer is signed in', async () => {
    const data = await loadHome({
      fetch,
      now: 0,
      random: Math.random,
      parent: parent({ slug: 'sean', firstName: 'Sean', avatarUrl: '', isVip: true }),
      ...fresh(),
    });
    expect(data.signedIn).toBe(true);
  });

  it('should render without fanart when every summary fails', async () => {
    server.use(http.get('https://apiz.trakt.tv/:type/:slug', () => new HttpResponse(null, { status: 503 })));
    const data = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), ...fresh() });

    expect(data.fanarts).toEqual([]);
  });

  it('should send eight trending posters a type, linked to their pages', async () => {
    const data = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), ...fresh() });

    expect(data.posters?.shows.map(({ href }) => href)).toEqual(['/shows/one', '/shows/two']);
    expect(data.posters?.movies.map(({ title, year }) => `${title} ${year}`)).toEqual([
      'Trending one 2026',
      'Trending two 2026',
    ]);
  });

  it('should stream who is watching the trending titles right now', async () => {
    const data = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), ...fresh() });
    const live = await data.live;

    expect(live?.shows).toBe(2);
    expect(live?.movies).toBe(2);
    expect(live?.countries.map(({ code }) => code)).toEqual(['BR']);
  });

  it('should leave the posters and the live count out when trending fails', async () => {
    server.use(http.get('https://apiz.trakt.tv/:type/trending', () => new HttpResponse(null, { status: 503 })));
    const data = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), ...fresh() });

    expect(data.posters).toBeNull();
    expect(await data.live).toBeNull();
  });

  it('should share the fanart, trending and the live count between workers through the data center cache', async () => {
    const kept = new Map<string, string>();
    const cache = {
      match: (key: string) => Promise.resolve(kept.has(key) ? new Response(kept.get(key)) : undefined),
      put: async (key: string, response: Response) => void kept.set(key, await response.text()),
    } satisfies KeyedCache;
    const read: string[] = [];
    server.events.on('request:start', ({ request }) => void read.push(new URL(request.url).pathname));

    const first = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), cache, ...fresh() });
    await first.live;
    const shared = read.filter((path) => path.endsWith('/trending') || path.endsWith('/watching')).length;
    read.length = 0;
    seen.length = 0;

    // A second worker, with empty memory of its own.
    const second = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), cache, ...fresh() });

    expect(shared).toBe(6);
    expect(await second.live).toEqual(await first.live);
    expect(second.posters).toEqual(first.posters);
    expect(second.fanarts.map(({ key }) => key).toSorted()).toEqual(first.fanarts.map(({ key }) => key).toSorted());
    expect(read).toEqual([]);
    expect(seen).toEqual([]);
    server.events.removeAllListeners();
  });
});
