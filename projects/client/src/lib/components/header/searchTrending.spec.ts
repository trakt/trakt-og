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
const list = (trakt: number) => ({
  like_count: 10,
  comment_count: 1,
  list: { name: `List ${trakt}`, type: 'personal', ids: { trakt, slug: `list-${trakt}` }, images: null },
});
const person = (trakt: number, birthday: string) => ({
  name: `Person ${trakt}`,
  ids: { trakt, slug: `person-${trakt}` },
  birthday,
  images: { headshot: [`media.trakt.tv/images/people/${trakt}/headshots/medium/a.jpg.webp`] },
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
  http.get('https://apiz.trakt.tv/lists/trending', ({ request }) => {
    seen.push(new URL(request.url));
    return HttpResponse.json([list(1), list(2)]);
  }),
  http.get('https://apiz.trakt.tv/people/this_month', ({ request }) => {
    seen.push(new URL(request.url));
    return HttpResponse.json([person(1, '1969-10-01'), person(2, '1980-10-12'), person(3, '1990-10-10')]);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const type = (slug: string) => searchTypes.find((option) => option.slug === slug) ?? searchTypes[0];
const today = '2026-10-10';

describe('searchTrending', () => {
  it('should merge shows and movies by search count for Shows & Movies and keep the top 5', async () => {
    const { label, rows } = await searchTrending({ type: type(''), today });

    expect(seen.map((url) => url.pathname).toSorted()).toEqual([
      '/search/recent_by_id/global/movies',
      '/search/recent_by_id/global/shows',
    ]);
    expect(seen.at(0)?.searchParams.get('limit')).toBe('5');
    expect(label).toBe('Most Searched');
    expect(rows.map((row) => row.href)).toEqual([
      '/shows/show-4',
      '/movies/movie-1',
      '/shows/show-5',
      '/movies/movie-2',
      '/movies/movie-3',
    ]);
  });

  it("should ask only for the picked type's list", async () => {
    const { rows } = await searchTrending({ type: type('movies'), today });

    expect(seen.map((url) => url.pathname)).toEqual(['/search/recent_by_id/global/movies']);
    expect(rows.map((row) => row.type)).toEqual(['Movie', 'Movie', 'Movie']);
  });

  it('should list the trending lists for Lists', async () => {
    const { label, rows } = await searchTrending({ type: type('lists'), today });

    expect(seen.map((url) => url.pathname)).toEqual(['/lists/trending']);
    expect(label).toBe('Trending Lists');
    expect(rows.map((row) => [row.title, row.href])).toEqual([
      ['List 1', '/lists/1'],
      ['List 2', '/lists/2'],
    ]);
  });

  it("should list this month's birthdays for People, today's first", async () => {
    const { label, rows } = await searchTrending({ type: type('people'), today });

    expect(seen.map((url) => url.pathname)).toEqual(['/people/this_month']);
    expect(label).toBe('Birthdays This Month');
    expect(rows.map((row) => [row.title, row.tag])).toEqual([
      ['Person 3', 'Today'],
      ['Person 2', 'Oct 12'],
      ['Person 1', 'Oct 1'],
    ]);
  });

  it('should throw when a list fails, so the dropdown can ask again', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/search/recent_by_id/global/:type', () => new HttpResponse(null, { status: 429 })),
    );

    await expect(searchTrending({ type: type('shows'), today })).rejects.toThrow();
  });

  it('should have none for the types the API keeps nothing for', async () => {
    for (const slug of ['episodes', 'users', 'trakt', 'imdb']) {
      expect((await searchTrending({ type: type(slug), today })).rows).toEqual([]);
    }
    expect(seen).toEqual([]);
  });
});
