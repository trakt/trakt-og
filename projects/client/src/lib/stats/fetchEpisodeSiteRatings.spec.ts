import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchEpisodeSiteRatings } from './fetchEpisodeSiteRatings.ts';

const API = 'https://apiz.trakt.tv';
const requests: Request[] = [];
const server = setupServer(
  http.get(`${API}/shows/:id/seasons/:season/episodes/:episode/ratings`, ({ params }) => {
    if (params.episode === '2') return new HttpResponse(null, { status: 503 });
    if (params.episode === '3') return HttpResponse.json({ imdb: { rating: 0 }, tmdb: null });
    if (params.episode === '4') return HttpResponse.json({ imdb: 'bad' });
    return HttpResponse.json({ rating: 8, imdb: { rating: 8.99, votes: 10 }, tmdb: { rating: 7.5 } });
  }),
);
server.events.on('request:start', ({ request }) => void requests.push(request));
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  requests.length = 0;
});
afterAll(() => server.close());

describe('util: fetchEpisodeSiteRatings', () => {
  it('should read each episode with its site ratings, without a token', async () => {
    await fetchEpisodeSiteRatings({ show: 'got', season: 8, episodes: [1] });
    const request = requests.at(0);
    expect(new URL(request?.url ?? API).pathname).toBe('/shows/got/seasons/8/episodes/1/ratings');
    expect(new URL(request?.url ?? API).searchParams.get('extended')).toBe('all');
    expect(request?.headers.has('authorization')).toBe(false);
  });

  it('should map the ratings to percents with their votes in the order of the episodes', async () => {
    expect(await fetchEpisodeSiteRatings({ show: 'got', season: 8, episodes: [1, 5] })).toEqual({
      imdb: { percents: [89, 89], votes: [10, 10] },
      tmdb: { percents: [75, 75], votes: [null, null] },
    });
  });

  it('should leave a gap for a failed, unrated or unparsable episode', async () => {
    expect(await fetchEpisodeSiteRatings({ show: 'got', season: 8, episodes: [2, 3, 4] })).toEqual({
      imdb: { percents: [null, null, null], votes: [null, null, null] },
      tmdb: { percents: [null, null, null], votes: [null, null, null] },
    });
  });
});
