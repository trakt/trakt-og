import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchListPosters } from './fetchListPosters.ts';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const URL_FOR = 'https://apiz.trakt.tv/lists/7';

describe('fetchListPosters', () => {
  it("should read the list's first five posters with images", async () => {
    server.use(http.get(URL_FOR, ({ request }) => {
      expect(new URL(request.url).searchParams.get('extended')).toBe('images');
      const posters = Array.from({ length: 7 }, (_, i) => `media.trakt.tv/images/shows/${i}/posters/thumb/p.jpg.webp`);
      return HttpResponse.json({ name: 'Picks', images: { posters } });
    }));
    const posters = await fetchListPosters({ fetch, listId: 7 });
    expect(posters).toHaveLength(5);
    expect(posters.at(0)?.image).toContain('media.trakt.tv/images/shows/0/posters');
  });

  it('should be empty on a failed or malformed read', async () => {
    server.use(http.get(URL_FOR, () => new HttpResponse(null, { status: 503 })));
    expect(await fetchListPosters({ fetch, listId: 7 })).toEqual([]);
    server.use(http.get(URL_FOR, () => HttpResponse.json({ images: { posters: 'nope' } })));
    expect(await fetchListPosters({ fetch, listId: 7 })).toEqual([]);
  });
});
