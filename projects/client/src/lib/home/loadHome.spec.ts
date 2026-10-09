import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { createTtlCache } from '../utils/createTtlCache.ts';
import { homeFanartTitles } from './homeFanartTitles.ts';
import { loadHome } from './loadHome.ts';
import type { HomeFanart } from './toHomeFanarts.ts';

const summary = (type: string, slug: string) => ({
  title: `Title ${slug}`,
  year: 2010,
  ids: { trakt: 1, slug },
  images: { fanart: [`media.trakt.tv/images/${type}/${slug}/fanarts/medium/a.jpg.webp`] },
});

const seen: Request[] = [];
const server = setupServer(
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
const parent = (user: HeaderUser | null = null) => () => Promise.resolve({ user });

describe('loadHome', () => {
  it('should read every hand-picked title without a token and return them all', async () => {
    const data = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), pool: freshPool() });

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
    const data = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), pool: freshPool() });

    expect(data.fanarts).toHaveLength(homeFanartTitles.length - 1);
    expect(data.fanarts.some(({ key }) => key === 'show-fringe')).toBe(false);
  });

  it('should say when the viewer is signed in', async () => {
    const data = await loadHome({
      fetch,
      now: 0,
      random: Math.random,
      parent: parent({ slug: 'sean', firstName: 'Sean', avatarUrl: '', isVip: true }),
      pool: freshPool(),
    });
    expect(data.signedIn).toBe(true);
  });

  it('should render without fanart when every summary fails', async () => {
    server.use(http.get('https://apiz.trakt.tv/:type/:slug', () => new HttpResponse(null, { status: 503 })));
    const data = await loadHome({ fetch, now: 0, random: Math.random, parent: parent(), pool: freshPool() });

    expect(data.fanarts).toEqual([]);
  });
});
