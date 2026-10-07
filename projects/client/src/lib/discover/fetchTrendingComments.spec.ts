import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchTrendingComments } from './fetchTrendingComments.ts';

const now = new Date('2026-10-07T16:00:00Z');
const row = {
  type: 'movie',
  comment: {
    id: 70,
    parent_id: 0,
    created_at: '2026-10-05T00:00:00.000Z',
    updated_at: '2026-10-05T00:00:00.000Z',
    comment: 'A review.',
    spoiler: false,
    review: true,
    replies: 0,
    likes: 5,
    user_stats: { rating: 8, play_count: 1, completed_count: 1 },
    user: { username: 'sean', ids: { slug: 'sean', trakt: 1 } },
  },
  movie: {
    ids: { trakt: 7, slug: 'movie-7' },
    title: 'Movie 7',
    year: 2026,
    released: '2026-01-01',
    images: { poster: ['media.trakt.tv/images/7/posters/medium/a.jpg.webp'] },
  },
};
const paths: string[] = [];
const server = setupServer(
  http.get('https://apiz.trakt.tv/comments/trending/:kind/:media', ({ request, params }) => {
    paths.push(new URL(request.url).pathname);
    return params.kind === 'reviews' ? HttpResponse.json([row]) : new HttpResponse(null, { status: 500 });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  paths.length = 0;
});
afterAll(() => server.close());

describe('fetchTrendingComments', () => {
  it('should ask for the picked kind and type of title', async () => {
    const comments = await fetchTrendingComments({ fetch, kind: 'reviews', media: 'movies', now });

    expect(paths).toEqual(['/comments/trending/reviews/movies']);
    expect(comments.map(({ href, item }) => [href, item.title])).toEqual([['/comments/70', 'Movie 7']]);
  });

  it('should come back empty when the call fails', async () => {
    expect(await fetchTrendingComments({ fetch, kind: 'shouts', media: 'all', now })).toEqual([]);
  });
});
