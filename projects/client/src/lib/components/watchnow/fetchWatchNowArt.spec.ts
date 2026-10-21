import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fetchWatchNowArt } from './fetchWatchNowArt.ts';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchWatchNowArt', () => {
  it("should load a season's or episode's art from its show", async () => {
    let requested = '';
    server.use(http.get('https://apiz.trakt.tv/shows/:id', ({ request }) => {
      requested = new URL(request.url).pathname;
      return HttpResponse.json({ images: { fanart: ['walter-r2.trakt.tv/images/shows/000/001/fanarts/thumb/a.jpg'] } });
    }));
    const art = await fetchWatchNowArt('/shows/1388/seasons/1/episodes/1');
    expect(requested).toBe('/shows/1388');
    expect(art).toBe('https://walter-r2.trakt.tv/images/shows/000/001/fanarts/medium/a.jpg');
  });

  it('should have no art when the read fails', async () => {
    server.use(http.get('https://apiz.trakt.tv/movies/:id', () => new HttpResponse(null, { status: 500 })));
    expect(await fetchWatchNowArt('/movies/1')).toBeUndefined();
  });
});
