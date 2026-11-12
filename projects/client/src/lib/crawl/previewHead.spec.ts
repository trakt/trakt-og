import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { previewHead } from './previewHead.ts';

const server = setupServer(http.get('*', () => new HttpResponse(null, { status: 404 })));
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const TRON = {
  title: 'TRON',
  year: 1982,
  ids: { trakt: 1, slug: 'tron-1982' },
  overview: 'A computer hacker is abducted into the digital world.',
  genres: ['science-fiction'],
  released: '1982-07-09',
  runtime: 96,
  status: 'released',
};

function movieApi() {
  const reads: string[] = [];
  server.use(
    http.get('https://apiz.trakt.tv/movies/:id', ({ request }) => {
      reads.push(new URL(request.url).pathname);
      return HttpResponse.json(TRON);
    }),
  );
  return reads;
}

const preview = (path: string, routeId: string | null, params: Record<string, string> = {}) =>
  previewHead({
    routeId,
    params,
    url: new URL(`https://og.trakt.tv${path}`),
    fetch: globalThis.fetch,
    now: new Date('2026-11-12T00:00:00Z'),
  });

const meta = (html: string, property: string) =>
  new RegExp(`<meta (?:property|name)="${property}" content="([^"]*)"`).exec(html)?.at(1);

describe('previewHead', () => {
  it("should answer with the movie page's head alone, from one read", async () => {
    const reads = movieApi();

    const response = await preview('/movies/tron-1982', '/movies/[id]', { id: 'tron-1982' });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(reads).toEqual(['/movies/tron-1982']);
    expect(meta(html, 'og:title')).toBe('TRON (1982)');
    expect(meta(html, 'og:description')).toBe(TRON.overview);
    expect(meta(html, 'og:image')).toBe('https://og.trakt.tv/api/art/movie/1/fanart/movie/1/poster');
    expect(meta(html, 'og:site_name')).toBe('Trakt OG Redux');
    expect(html).toContain('<body></body>');
  });

  it("should give a subpage its own title over the movie's art", async () => {
    movieApi();

    const html = await (await preview('/movies/tron-1982/people', '/movies/[id]/people', { id: 'tron-1982' })).text();

    expect(meta(html, 'og:title')).toBe('TRON (1982): People');
    expect(meta(html, 'og:url')).toBe('https://og.trakt.tv/movies/tron-1982/people');
    expect(meta(html, 'og:image')).toBe('https://og.trakt.tv/api/art/movie/1/fanart/movie/1/poster');
  });

  it("should answer a missing movie with a 404 and the site's own head", async () => {
    const response = await preview('/movies/no-such-movie', '/movies/[id]', { id: 'no-such-movie' });
    const html = await response.text();

    expect(response.status).toBe(404);
    expect(meta(html, 'og:title')).toBe('Trakt OG Redux');
    expect(meta(html, 'robots')).toBe('noindex, follow');
  });

  it("should give a page without a source the site's own head, without reading the API", async () => {
    const reads = movieApi();

    const response = await preview('/movies/trending', '/movies/[chart=chart]/[[period]]', { chart: 'trending' });

    expect(response.status).toBe(200);
    expect(meta(await response.text(), 'og:image')).toBe('https://og.trakt.tv/og-share.jpg');
    expect(reads).toEqual([]);
  });

  it('should answer a path no route matches with a 404', async () => {
    expect((await preview('/nowhere', null)).status).toBe(404);
  });
});
