import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchStatsCounts } from './fetchStatsCounts.ts';

const COUNTS: Record<string, number> = {
  'watched/movies': 12,
  'watched/shows': 3,
  'watched/episodes': 140,
  'ratings/movies': 5,
  'ratings/episodes': 2,
  'ratings/all/8': 4,
  'ratings/all/10': 3,
  'comments/all/seasons': 1,
  lists: 6,
};
const seen: Request[] = [];
const server = setupServer(
  http.get('https://apiz.trakt.tv/users/tester/*', ({ request }) => {
    seen.push(request);
    const path = new URL(request.url).pathname.replace('/users/tester/', '');
    return HttpResponse.json([], { headers: { 'X-Pagination-Item-Count': String(COUNTS[path] ?? 0) } });
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

describe('fetchStatsCounts', () => {
  it("should read each count from a one-row page's item count, with the token", async () => {
    const counts = await fetchStatsCounts({ fetch, token: 'token', id: 'tester' });

    expect(counts).toEqual({
      watched: { movies: 12, shows: 3, episodes: 140 },
      ratings: {
        movies: 5,
        shows: 0,
        seasons: 0,
        episodes: 2,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 4, 9: 0, 10: 3 },
      },
      comments: { movies: 0, shows: 0, seasons: 1, episodes: 0 },
      lists: 6,
    });
    expect(seen.every((request) => new URL(request.url).searchParams.get('limit') === '1')).toBe(true);
    const comments = seen.filter((request) => new URL(request.url).pathname.includes('/comments/'));
    expect(comments.every((request) => new URL(request.url).searchParams.get('include_replies') === 'true')).toBe(true);
    expect(seen.every((request) => request.headers.get('authorization') === 'Bearer token')).toBe(true);
  });

  it('should fail when a count fails, rather than read it as zero', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/users/tester/ratings/all/8', () => new HttpResponse(null, { status: 502 })),
    );

    await expect(fetchStatsCounts({ fetch, token: null, id: 'tester' })).rejects.toThrow('ratings/all/8');
  });
});
