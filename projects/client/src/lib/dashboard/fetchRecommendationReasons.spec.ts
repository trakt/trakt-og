import { http, HttpResponse, type JsonBodyType } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchRecommendationReasons } from './fetchRecommendationReasons.ts';

const BASE = 'https://apiz.trakt.tv';
const server = setupServer();
const seen: Request[] = [];

const title = (id: number, name: string) => ({
  title: name,
  year: 2017,
  ids: { trakt: id, slug: `slug-${id}` },
  images: { poster: [`media.trakt.tv/images/x/${id}/posters/medium/p.jpg.webp`] },
});

const respond = (status: number, body: JsonBodyType) =>
  server.use(
    http.get(`${BASE}/v3/recommendations/:type/:id/reasons`, ({ request }) => {
      seen.push(request);
      return HttpResponse.json(body, { status });
    }),
  );

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

describe('fetchRecommendationReasons', () => {
  it('should read the one pick it is asked for', async () => {
    respond(200, { sources: [], people: [] });
    await fetchRecommendationReasons({ fetch, type: 'show', id: 1388 });

    expect(new URL(seen.at(0)?.url ?? '').pathname).toBe('/v3/recommendations/show/1388/reasons');
  });

  it('should group the sources like the list does', async () => {
    respond(200, {
      sources: [
        { id: 10, type: 'activity', stars: 9, show: title(5, 'Dark') },
        { id: 11, type: 'favorite', stars: null, show: title(5, 'Dark') },
        {
          id: 12,
          type: 'subgenre',
          stars: null,
          show: title(5, 'Dark'),
          subgenres: [{ id: 1, name: 'Mind-bender', slug: 'mind-bender' }],
        },
      ],
      people: [],
    });

    const why = await fetchRecommendationReasons({ fetch, type: 'movie', id: 1 });

    expect(why?.titles).toEqual([
      expect.objectContaining({ type: 'show', id: 5, title: 'Dark', stars: 9, watched: true, loved: true }),
    ]);
    expect(why?.likes).toEqual(['Mind-bender']);
  });

  it('should say what a person did across the titles the viewer watched', async () => {
    respond(200, {
      sources: [],
      people: [
        {
          person: {
            name: 'Vince Gilligan',
            ids: { trakt: 9486, slug: 'vince-gilligan' },
            images: { headshot: ['media.trakt.tv/images/people/9486/headshots/medium/h.jpg.webp'] },
          },
          role: 'making',
          watched_roles: ['making', 'acting'],
          watched_count: 5,
          titles: [
            { show: title(1, 'Better Call Saul') },
            { movie: title(2, 'El Camino') },
            { show: title(3, 'The X-Files') },
            { show: title(4, 'Pluribus') },
          ],
        },
      ],
    });

    const why = await fetchRecommendationReasons({ fetch, type: 'show', id: 1388 });

    expect(why?.people).toEqual([
      expect.objectContaining({
        href: '/people/vince-gilligan',
        name: 'Vince Gilligan',
        line: "Created and acted in 5 titles you've watched",
        titles: [
          expect.objectContaining({ key: 'show:1', title: 'Better Call Saul' }),
          expect.objectContaining({ key: 'movie:2', title: 'El Camino' }),
          expect.objectContaining({ key: 'show:3', title: 'The X-Files' }),
        ],
        more: 2,
      }),
    ]);
  });

  it('should keep the titles when the people come back in a shape it cannot read', async () => {
    respond(200, { sources: [{ id: 10, type: 'activity', stars: 9, show: title(5, 'Dark') }], people: [{}] });

    const why = await fetchRecommendationReasons({ fetch, type: 'show', id: 1 });

    expect(why?.titles).toHaveLength(1);
    expect(why?.people).toEqual([]);
  });

  it('should return no reasons when there are none', async () => {
    respond(200, { sources: [], people: [] });

    expect(await fetchRecommendationReasons({ fetch, type: 'show', id: 1 })).toEqual({
      titles: [],
      likes: [],
      people: [],
    });
  });

  it('should return null when the request fails', async () => {
    respond(403, { error: 'forbidden' });

    expect(await fetchRecommendationReasons({ fetch, type: 'show', id: 1 })).toBeNull();
  });
});
