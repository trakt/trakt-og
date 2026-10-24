import { isHttpError } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { SubpageItem } from '../subpage/SubpageItem.ts';
import { loadVideos } from './loadVideos.ts';

const API = 'https://apiz.trakt.tv';
const show = {
  title: 'Breaking Bad',
  year: 2008,
  ids: { trakt: 1388, slug: 'breaking-bad' },
  first_aired: '2008-01-20',
};
const movie = { title: 'Fight Club', year: 1999, ids: { trakt: 1, slug: 'fight-club-1999' }, released: '1999-10-15' };
const season = { number: 1, ids: { trakt: 3950 }, first_aired: '2008-01-20' };
const episode = { season: 1, number: 1, title: 'Pilot', ids: { trakt: 73482 }, first_aired: '2008-01-20' };
const trailer = {
  title: 'Official Trailer',
  url: 'https://youtube.com/watch?v=HhesaQXLuRY',
  site: 'youtube',
  type: 'trailer',
  size: 1080,
  official: true,
  published_at: '2025-01-01T00:00:00.000Z',
  country: 'us',
  language: 'en',
};
const requests: Request[] = [];
const server = setupServer(
  http.get(`${API}/movies/:id`, () => HttpResponse.json(movie)),
  http.get(`${API}/shows/:id`, () => HttpResponse.json(show)),
  // The sibling arrows' seasons, with their episodes for an episode's.
  http.get(`${API}/shows/:id/seasons`, () => HttpResponse.json([{ ...season, episodes: [episode] }])),
  http.get(`${API}/shows/:id/seasons/:season/info`, () => HttpResponse.json(season)),
  http.get(`${API}/shows/:id/seasons/:season/episodes/:episode`, () => HttpResponse.json(episode)),
  http.get(`${API}/*/videos`, () => HttpResponse.json([trailer])),
  http.get(`${API}/*`, () => new HttpResponse(null, { status: 404 })),
);
server.events.on('request:start', ({ request }) => void requests.push(request));
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  requests.length = 0;
});
afterAll(() => server.close());
const load = (item: SubpageItem) =>
  loadVideos({
    fetch: globalThis.fetch,
    parent: () =>
      Promise.resolve({
        user: null,
        settings: null,
        datePreferences: { order: 'ymd', hour24: false, timeZone: 'UTC', weekStartDay: 0 },
      }),
    item,
  });
const failure = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (error: unknown) => error,
  );

describe('loadVideos', () => {
  it.each<SubpageItem>([
    { type: 'movie', id: 'fight-club-1999' },
    { type: 'show', id: 'breaking-bad' },
    { type: 'season', id: 'breaking-bad', season: '1' },
    { type: 'episode', id: 'breaking-bad', season: '1', episode: '1' },
  ])("should read the $type's videos from its own path", async (item) => {
    const data = await load(item);
    expect(data.videos.map(({ title }) => title)).toEqual(['Official Trailer']);
    const videos = requests.find((request) => request.url.endsWith('/videos'));
    expect(new URL(videos?.url ?? API).pathname).toBe(`${data.media.href}/videos`);
  });

  it('should show no videos when the item has none to read', async () => {
    server.use(http.get(`${API}/movies/:id/videos`, () => new HttpResponse(null, { status: 404 })));
    expect((await load({ type: 'movie', id: 'fight-club-1999' })).videos).toEqual([]);
  });

  it('should fail with a 502 when the videos do not load', async () => {
    server.use(http.get(`${API}/movies/:id/videos`, () => HttpResponse.json({}, { status: 500 })));
    const error = await failure(load({ type: 'movie', id: 'fight-club-1999' }));
    expect(isHttpError(error) && error.status).toBe(502);
  });
});
