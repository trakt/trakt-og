import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { api } from '../api/api.ts';
import { sumTrendingWatchers } from './sumTrendingWatchers.ts';

const seen: URL[] = [];
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const client = api({ fetch: (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args) });

describe('util: sumTrendingWatchers', () => {
  it('should read the filtered chart whole and add up its pages', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/shows/trending', ({ request }) => {
        const url = new URL(request.url);
        seen.push(url);
        const users = url.searchParams.get('page') === '1' ? 1200 : 40;
        return HttpResponse.json([], {
          headers: { 'X-Trending-User-Count': `${users}`, 'X-Pagination-Item-Count': '260' },
        });
      }),
    );

    const watchers = await sumTrendingWatchers({
      client,
      type: 'shows',
      filters: { genres: 'drama', ignore_watched: true },
    });

    expect(watchers).toBe(1240);
    expect(seen.map((url) => url.searchParams.get('page'))).toEqual(['1', '2']);
    expect(seen.every((url) => url.searchParams.get('genres') === 'drama')).toBe(true);
    expect(seen.every((url) => url.searchParams.get('ignore_watched') === 'true')).toBe(true);
  });

  it("should give null when the chart's first page doesn't load", async () => {
    server.use(http.get('https://apiz.trakt.tv/movies/trending', () => new HttpResponse(null, { status: 500 })));

    expect(await sumTrendingWatchers({ client, type: 'movies' })).toBeNull();
  });
});
