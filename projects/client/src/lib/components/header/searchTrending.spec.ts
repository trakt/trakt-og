import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { searchTrending } from './searchTrending.ts';
import { searchTypes } from './searchTypes.ts';

const media = (kind: 'movie' | 'show', trakt: number, count: number) => ({
  id: trakt,
  count,
  type: kind,
  [kind]: { title: `${kind} ${trakt}`, year: 2026, ids: { trakt, slug: `${kind}-${trakt}` }, genres: [], images: null },
});

const seen: URL[] = [];
const server = setupServer(
  http.get('https://apiz.trakt.tv/search/recent_by_id/global/:type', ({ request, params }) => {
    seen.push(new URL(request.url));
    return HttpResponse.json(
      params.type === 'movies'
        ? [media('movie', 1, 2085), media('movie', 2, 1972), media('movie', 3, 900)]
        : [media('show', 4, 3620), media('show', 5, 2000), media('show', 6, 800)],
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const type = (slug: string) => searchTypes.find((option) => option.slug === slug) ?? searchTypes[0];

describe('searchTrending', () => {
  it('should merge shows and movies by search count for Shows & Movies and keep the top 5', async () => {
    const rows = await searchTrending({ type: type('') });

    expect(seen.map((url) => url.pathname).toSorted()).toEqual([
      '/search/recent_by_id/global/movies',
      '/search/recent_by_id/global/shows',
    ]);
    expect(seen.at(0)?.searchParams.get('limit')).toBe('5');
    expect(rows.map((row) => row.href)).toEqual([
      '/shows/show-4',
      '/movies/movie-1',
      '/shows/show-5',
      '/movies/movie-2',
      '/movies/movie-3',
    ]);
  });

  it("should ask only for the picked type's list", async () => {
    const rows = await searchTrending({ type: type('movies') });

    expect(seen.map((url) => url.pathname)).toEqual(['/search/recent_by_id/global/movies']);
    expect(rows.map((row) => row.type)).toEqual(['Movie', 'Movie', 'Movie']);
  });

  it('should have none for the types the API keeps no trending searches for', async () => {
    for (const slug of ['episodes', 'people', 'lists', 'users', 'trakt', 'imdb']) {
      expect(await searchTrending({ type: type(slug) })).toEqual([]);
    }
    expect(seen).toEqual([]);
  });
});
