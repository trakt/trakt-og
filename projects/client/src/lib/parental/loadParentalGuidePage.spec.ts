import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadParentalGuidePage } from './loadParentalGuidePage.ts';

const API = 'https://apiz.trakt.tv';
const show = { title: 'Phony', year: 2026, ids: { trakt: 9, slug: 'phony' }, country: 'us', first_aired: '2026-10-20' };
const movie = { title: 'Fight Club', year: 1999, ids: { trakt: 1, slug: 'fight-club-1999' }, country: 'us' };
const requests: Request[] = [];
const server = setupServer(
  http.get(`${API}/movies/:id`, () => HttpResponse.json(movie)),
  http.get(`${API}/shows/:id`, () => HttpResponse.json(show)),
  http.get(`${API}/shows/:id/certifications`, () =>
    HttpResponse.json([
      { certification: '14', country: 'br' },
      { certification: 'TV-MA', country: 'us' },
    ]),
  ),
  http.get(`${API}/movies/:id/releases`, () =>
    HttpResponse.json([
      { country: 'us', certification: 'R', release_date: '1999-10-15', release_type: 'theatrical' },
      { country: 'de', certification: '18', release_date: '1999-11-11', release_type: 'theatrical' },
    ]),
  ),
  http.get(`${API}/v3/media/:type/:slug/info/16/version/1`, () =>
    HttpResponse.json({ guide: [{ category: 'VIOLENCE', severity: 'SEVERE' }] }),
  ),
  http.get(`${API}/*`, () => new HttpResponse(null, { status: 404 })),
);
server.events.on('request:start', ({ request }) => void requests.push(request));
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  requests.length = 0;
});
afterAll(() => server.close());

const load = (item: { type: 'movie' | 'show'; id: string }, token: string | null = 'token') =>
  loadParentalGuidePage({
    fetch: globalThis.fetch,
    token,
    parent: () =>
      Promise.resolve({
        user: null,
        settings: null,
        datePreferences: { order: 'ymd', hour24: false, timeZone: 'UTC', weekStartDay: 0 },
      }),
    item,
  });
const labels = (data: Awaited<ReturnType<typeof load>>) => data.certifications.groups.map(({ label }) => label);

describe('loadParentalGuidePage', () => {
  it("should read a show's ratings from its certifications, led by its origin country", async () => {
    const data = await load({ type: 'show', id: 'phony' });
    expect(labels(data)).toEqual(['14+', '17+']);
    expect(data.certifications.featured.map(({ certification }) => certification)).toEqual(['TV-MA']);
    expect(data.guide).toEqual([{ category: 'violence', level: 3 }]);
  });

  it("should read a movie's ratings from its releases", async () => {
    const data = await load({ type: 'movie', id: 'fight-club-1999' });
    expect(labels(data)).toEqual(['17+', '18+']);
  });

  it('should leave the guide out for a guest and still list the ratings', async () => {
    const data = await load({ type: 'show', id: 'phony' }, null);
    expect(data.guide).toEqual([]);
    expect(labels(data)).toEqual(['14+', '17+']);
    expect(requests.some(({ url }) => url.includes('/v3/'))).toBe(false);
  });

  it('should keep the page when the ratings fail to load', async () => {
    server.use(http.get(`${API}/shows/:id/certifications`, () => new HttpResponse(null, { status: 500 })));
    const data = await load({ type: 'show', id: 'phony' });
    expect(data.certifications.count).toBe(0);
  });
});
