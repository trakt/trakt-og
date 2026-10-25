import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { fetchLatestPlay } from './fetchLatestPlay.ts';

const API = 'https://apiz.trakt.tv';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const request = (path: string) => rawApiFetch({ path });

describe('fetchLatestPlay', () => {
  it.each(['movie', 'episode'] as const)("should read a %s's most recent play", async (type) => {
    server.use(
      http.get(`${API}/sync/history/${type}s/7`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('limit')).toBe('1');
        return HttpResponse.json([{ id: 900, watched_at: '2026-10-01T20:00:00.000Z', action: 'watch', type }]);
      }),
    );
    expect(await fetchLatestPlay({ target: { type, id: 7 }, request })).toEqual({
      id: 900,
      watchedAt: '2026-10-01T20:00:00.000Z',
    });
  });
  it('should throw when there is no play', async () => {
    server.use(http.get(`${API}/sync/history/movies/7`, () => HttpResponse.json([])));
    await expect(fetchLatestPlay({ target: { type: 'movie', id: 7 }, request })).rejects.toThrow('Play not found');
  });
  it('should throw on a failed request', async () => {
    server.use(http.get(`${API}/sync/history/movies/7`, () => new HttpResponse(null, { status: 500 })));
    await expect(fetchLatestPlay({ target: { type: 'movie', id: 7 }, request })).rejects.toThrow('500');
  });
  it('should throw on a malformed row', async () => {
    server.use(http.get(`${API}/sync/history/movies/7`, () => HttpResponse.json([{ id: '900' }])));
    await expect(fetchLatestPlay({ target: { type: 'movie', id: 7 }, request })).rejects.toThrow();
  });
});
