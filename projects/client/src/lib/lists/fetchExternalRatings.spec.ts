import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createExternalRatingsReader } from './fetchExternalRatings.ts';

const API = 'https://apiz.trakt.tv';
const ratings = {
  trakt: {
    rating: 8.1,
    votes: 1200,
    distribution: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1 },
  },
  imdb: { rating: 8.3, votes: 998_068, link: 'https://www.imdb.com/title/tt0113277' },
};
const seen: string[] = [];
let status = 200;

const server = setupServer(
  http.get(`${API}/movies/:id/ratings`, ({ request }) => {
    seen.push(new URL(request.url).pathname);
    return status === 200
      ? HttpResponse.json(ratings)
      : new HttpResponse(null, { status, headers: { 'Retry-After': '30' } });
  }),
  http.get(`${API}/shows/:id/seasons/:season/episodes/:episode/ratings`, ({ request }) => {
    seen.push(new URL(request.url).pathname);
    return HttpResponse.json(ratings);
  }),
);
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
  status = 200;
});
afterAll(() => server.close());

const clock = (start = 0) => {
  let at = start;
  return { now: () => at, advance: (ms: number) => (at += ms) };
};

describe('util: createExternalRatingsReader', () => {
  it('should read an item once, however many posters ask', async () => {
    const read = createExternalRatingsReader({ fetch });
    const [first, second] = await Promise.all([read({ type: 'movie', id: 1 }), read({ type: 'movie', id: 1 })]);
    expect(first?.imdb?.rating).toBe(8.3);
    expect(second).toBe(first);
    expect(seen).toEqual(['/movies/1/ratings']);
  });

  it('should read an episode under its show, season and number', async () => {
    const read = createExternalRatingsReader({ fetch });
    await read({ type: 'episode', id: 9, seasonOf: { show: 4, number: 2, episode: 3 } });
    expect(seen).toEqual(['/shows/4/seasons/2/episodes/3/ratings']);
  });

  it('should stop at its budget until the window moves on', async () => {
    const time = clock();
    const read = createExternalRatingsReader({ fetch, now: time.now, budget: 2, windowMs: 1000 });
    await Promise.all([1, 2].map((id) => read({ type: 'movie', id })));
    expect(await read({ type: 'movie', id: 3 })).toBeNull();
    expect(seen).toHaveLength(2);

    time.advance(1000);
    expect(await read({ type: 'movie', id: 3 })).not.toBeNull();
    expect(seen).toHaveLength(3);
  });

  it('should stop every read after a 429 until its Retry-After has passed', async () => {
    const time = clock();
    const read = createExternalRatingsReader({ fetch, now: time.now });
    status = 429;
    expect(await read({ type: 'movie', id: 1 })).toBeNull();
    status = 200;
    expect(await read({ type: 'movie', id: 2 })).toBeNull();
    expect(seen).toEqual(['/movies/1/ratings']);

    time.advance(30_000);
    expect(await read({ type: 'movie', id: 1 })).not.toBeNull();
    expect(seen).toEqual(['/movies/1/ratings', '/movies/1/ratings']);
  });
});
