import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { previewHead } from './previewHead.ts';

const API = 'https://apiz.trakt.tv';
const reads: string[] = [];
const server = setupServer(http.get('*', () => new HttpResponse(null, { status: 404 })));
server.events.on('request:start', ({ request }) => {
  reads.push(new URL(request.url).pathname.replace(/\/$/, ''));
});
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => {
  reads.length = 0;
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const preview = async (routeId: string, path: string, params: Record<string, string> = {}) => {
  const url = new URL(`https://og.trakt.tv${path}`);
  const response = await previewHead({
    routeId,
    params,
    url,
    fetch: globalThis.fetch,
    now: new Date('2026-11-12T00:00:00Z'),
  });
  return { status: response.status, html: await response.text() };
};

const meta = (html: string, property: string) =>
  new RegExp(`<meta (?:property|name)="${property}" content="([^"]*)"`).exec(html)?.at(1);

const profile = (extra: Record<string, unknown> = {}) => ({
  username: 'sean',
  name: 'Sean Smith',
  private: false,
  ids: { slug: 'sean', trakt: 7 },
  ...extra,
});

const listSummary = (extra: Record<string, unknown> = {}) => ({
  name: 'Heist Night',
  description: 'Crews.',
  privacy: 'public',
  type: 'personal',
  display_numbers: true,
  allow_comments: true,
  sort_by: 'rank',
  sort_how: 'asc',
  item_count: 2,
  comment_count: 0,
  likes: 3,
  ids: { trakt: 44, slug: 'heist-night' },
  user: { username: 'sean', ids: { slug: 'sean' } },
  ...extra,
});

const movieRow = (id: number) => ({
  type: 'movie',
  rank: id,
  id: 100 + id,
  listed_at: '2026-01-02T00:00:00.000Z',
  notes: null,
  movie: { title: 'Heat', ids: { trakt: id, slug: 'heat-1995' } },
});

const itemsHeaders = { 'X-Pagination-Item-Count': '2', 'X-Sort-By': 'rank', 'X-Sort-How': 'asc' };

describe('pagePreviewHead', () => {
  describe('for pages whose head needs no data', () => {
    it('should give the home page its head and canonical `/`, without reading the API', async () => {
      const { status, html } = await preview('/home', '/home');

      expect(status).toBe(200);
      expect(reads).toEqual([]);
      expect(meta(html, 'og:title')).toBe('Classic Trakt, rebuilt for big screens');
      expect(html).toContain('<link rel="canonical" href="https://og.trakt.tv/"');
      expect(html).toContain('application/ld+json');
    });

    it.each([
      ['/about', 'About OG Redux'],
      ['/discover', 'Discover new TV shows &amp; movies'],
      ['/dashboard', 'Dashboard'],
      ['/signin', 'Sign in'],
      ['/signout', 'Sign out'],
      ['/callback', 'Signing in'],
    ])('should give %s its title, without reading the API', async (routeId, title) => {
      const { html } = await preview(routeId, routeId);

      expect(reads).toEqual([]);
      expect(meta(html, 'og:title')).toBe(title);
    });

    it('should keep the live page out of search', async () => {
      const { html } = await preview('/live', '/live');

      expect(meta(html, 'robots')).toBe('noindex, follow');
      expect(meta(html, 'og:title')).toBe('Trakt Worldwide, live');
    });
  });

  describe('for charts', () => {
    const route = '/movies/[chart=chart]/[[period]]';

    it('should name a period chart by its period, without reading the API', async () => {
      const { html } = await preview(route, '/movies/watched/monthly', { chart: 'watched', period: 'monthly' });

      expect(reads).toEqual([]);
      expect(meta(html, 'og:title')).toBe('Most watched movies for the last 30 days');
      expect(meta(html, 'og:description')).toBe('Most watched movies for the last 30 days by the Trakt community.');
    });

    it('should read an old chart name as the chart it redirects to', async () => {
      const { html } = await preview('/shows/[chart=chart]/[[period]]', '/shows/collected', { chart: 'collected' });

      expect(meta(html, 'og:title')).toBe('Most watched shows for the last 7 days');
    });

    it('should answer a period on a chart without one with a 404', async () => {
      const { status } = await preview(route, '/movies/trending/daily', { chart: 'trending', period: 'daily' });

      expect(status).toBe(404);
    });

    it("should give a signed-out visitor's recommendations the sign-in head", async () => {
      const { html } = await preview(route, '/movies/recommendations', { chart: 'recommendations' });

      expect(meta(html, 'og:title')).toBe('Sign in');
    });
  });

  describe('for the box office', () => {
    const route = '/movies/boxoffice';

    it("should use the list's description, from one read", async () => {
      server.use(http.get(`${API}/lists/1267169`, () => HttpResponse.json(listSummary({ description: 'Top ten.' }))));

      const { html } = await preview(route, route);

      expect(reads).toEqual(['/lists/1267169']);
      expect(meta(html, 'og:title')).toBe('Weekend Box Office');
      expect(meta(html, 'og:description')).toBe('Top ten.');
    });

    it("should fall back to the chart's own line when the list can't be read", async () => {
      const { html } = await preview(route, route);

      expect(meta(html, 'og:description')).toBe(
        'The top 10 movies at the US box office this weekend, with what each grossed.',
      );
    });
  });

  describe('for calendars', () => {
    const route = '/calendars/[calendar=calendar]/[[start]]';

    it('should name the month in the URL, without reading the API', async () => {
      const { html } = await preview(route, '/calendars/finales/2026-03-15', {
        calendar: 'finales',
        start: '2026-03-15',
      });

      expect(reads).toEqual([]);
      expect(meta(html, 'og:title')).toBe('Finales Calendar · March 2026');
      expect(meta(html, 'og:description')).toBe("What's on the Finales calendar in March 2026, day by day, on Trakt.");
    });

    it('should open on this month without a date', async () => {
      const { html } = await preview(route, '/calendars/movies', { calendar: 'movies' });

      expect(meta(html, 'og:title')).toBe('Movies Calendar · November 2026');
    });

    it('should send a signed-out visitor to My calendars to sign in', async () => {
      const { html } = await preview('/calendars/my/[calendar=myCalendar]/[[start]]', '/calendars/my/shows', {
        calendar: 'shows',
      });

      expect(meta(html, 'og:title')).toBe('Sign in');
    });
  });

  describe('for search', () => {
    it("should name a tab's results by its query, without reading the API", async () => {
      const { html } = await preview('/search/[[type=searchType]]', '/search/movies?query=heat', { type: 'movies' });

      expect(reads).toEqual([]);
      expect(meta(html, 'og:title')).toBe('Movie search results for heat');
    });

    it('should take the query from the path', async () => {
      const { html } = await preview('/search/[type=searchType]/[id]', '/search/people/cher', {
        type: 'people',
        id: 'cher',
      });

      expect(meta(html, 'og:title')).toBe('Person search results for cher');
    });

    it('should title an empty Lists search by the lists it browses', async () => {
      const { html } = await preview('/search/[[type=searchType]]', '/search/lists?type=official', {
        type: 'lists',
      });

      expect(meta(html, 'og:title')).toBe('Popular Official Lists');
    });
  });

  describe('for members', () => {
    const route = '/users/[id]';

    it("should use a profile's About text from one read", async () => {
      server.use(http.get(`${API}/users/sean`, () => HttpResponse.json(profile({ about: 'I watch things.' }))));

      const { html } = await preview(route, '/users/sean', { id: 'sean' });

      expect(reads).toEqual(['/users/sean']);
      expect(meta(html, 'og:title')).toBe('Sean Smith (@sean)');
      expect(meta(html, 'og:description')).toBe('I watch things.');
    });

    it('should read the stats only for a profile without an About text', async () => {
      server.use(http.get(`${API}/users/sean`, () => HttpResponse.json(profile())));

      const { html } = await preview(route, '/users/sean', { id: 'sean' });

      expect(reads).toEqual(['/users/sean', '/users/sean/stats']);
      expect(meta(html, 'og:description')).toBe('Sean tracks the shows and movies they watch on Trakt.');
    });

    it('should show a private profile as its name alone, on every page of it', async () => {
      server.use(http.get(`${API}/users/sean`, () => HttpResponse.json({ username: 'sean', private: true, ids: {} })));

      const { html } = await preview('/users/[id]/history/[[type=historyType]]/[...sort]', '/users/sean/history', {
        id: 'sean',
      });

      expect(reads).toEqual(['/users/sean']);
      expect(meta(html, 'og:title')).toBe("sean's profile");
      expect(meta(html, 'robots')).toBe('noindex, follow');
    });

    it('should answer a missing member with a 404', async () => {
      const { status } = await preview(route, '/users/nobody', { id: 'nobody' });

      expect(status).toBe(404);
    });

    it.each([
      [
        '/users/[id]/history/[[type=historyType]]/[...sort]',
        '/users/sean/history/movies',
        { type: 'movies' },
        "Sean Smith's movie watched history",
      ],
      [
        '/users/[id]/library/[[type=historyType]]/[...sort]',
        '/users/sean/library',
        {},
        "Sean Smith's show and movie library",
      ],
      [
        '/users/[id]/ratings/[[type=ratingType]]/[...filters]',
        '/users/sean/ratings/shows/10',
        { type: 'shows', filters: '10' },
        "Sean Smith's show ratings",
      ],
      [
        '/users/[id]/notes/[[type=noteType]]',
        '/users/sean/notes/collection',
        { type: 'collection' },
        "Sean Smith's library notes",
      ],
      [
        '/users/[id]/network/[[type=networkType]]/[[sort=networkSort]]',
        '/users/sean/network/following_pending',
        { type: 'following_pending' },
        "Sean Smith's following",
      ],
      [
        '/users/[id]/comments/[[comment_type=userCommentType]]/[[type=userCommentMediaType]]/[[sort_by=userCommentSort]]',
        '/users/sean/comments/all/movies',
        { type: 'movies' },
        "Sean Smith's movie comments",
      ],
      ['/users/[id]/lists', '/users/sean/lists', {}, "Sean Smith's personal lists"],
      ['/users/[id]/lists/liked/official', '/users/sean/lists/liked/official', {}, "Sean Smith's liked official lists"],
      ['/users/[id]/smart-lists', '/users/sean/smart-lists', {}, "Sean Smith's smart lists"],
    ])('should title %s from the profile alone', async (routeId, path, params, title) => {
      server.use(http.get(`${API}/users/sean`, () => HttpResponse.json(profile())));

      const { html } = await preview(routeId, path, { id: 'sean', ...params });

      expect(reads).toEqual(['/users/sean']);
      expect(meta(html, 'og:title')).toBe(title);
    });

    it('should point a history of one movie at Movies', async () => {
      server.use(http.get(`${API}/users/sean`, () => HttpResponse.json(profile())));

      const { html } = await preview(
        '/users/[id]/history/[[type=historyType]]/[...sort]',
        '/users/sean/history?movie=5',
        {
          id: 'sean',
        },
      );

      expect(meta(html, 'og:title')).toBe("Sean Smith's movie watched history");
    });

    it("should send a signed-out visitor to someone's progress to their profile", async () => {
      server.use(http.get(`${API}/users/sean`, () => HttpResponse.json(profile({ about: 'Hi.' }))));

      const { html } = await preview('/users/[id]/progress/[[type=progressType]]/[...sort]', '/users/sean/progress', {
        id: 'sean',
      });

      expect(meta(html, 'og:title')).toBe('Sean Smith (@sean)');
    });
  });

  describe('for lists', () => {
    const listRoute = '/users/[id]/lists/[list]';
    const params = { id: 'sean', list: 'heist-night' };

    beforeEach(() => {
      server.use(
        http.get(`${API}/users/sean`, () => HttpResponse.json(profile())),
        http.get(`${API}/users/sean/lists/heist-night`, () => HttpResponse.json(listSummary())),
        http.get(`${API}/users/sean/lists/heist-night/items*`, () =>
          HttpResponse.json([movieRow(1), movieRow(2)], { headers: itemsHeaders }),
        ),
      );
    });

    it("should head a personal list by its owner with its first item's art, from three reads", async () => {
      const { html } = await preview(listRoute, '/users/sean/lists/heist-night', params);

      expect(reads).toHaveLength(3);
      expect(meta(html, 'og:title')).toBe('Heist Night by Sean Smith');
      expect(meta(html, 'og:description')).toBe('Crews.');
      expect(meta(html, 'og:image')).toBe('https://og.trakt.tv/api/art/movie/1/fanart/movie/1/poster');
      expect(meta(html, 'robots')).toMatch(/^index/);
    });

    it('should keep a list only the owner can see out of the preview with a 404', async () => {
      server.use(
        http.get(`${API}/users/sean/lists/heist-night`, () => new HttpResponse(null, { status: 204 })),
        http.get(`${API}/users/sean/lists/heist-night/items*`, () => new HttpResponse('private', { status: 403 })),
      );

      const { status } = await preview(listRoute, '/users/sean/lists/heist-night', params);

      expect(status).toBe(404);
    });

    it("should head a member's watchlist by its owner and keep it out of search", async () => {
      server.use(
        http.get(`${API}/users/sean/watchlist*`, () =>
          HttpResponse.json([movieRow(1), movieRow(2)], { headers: itemsHeaders }),
        ),
      );

      const { html } = await preview('/users/[id]/watchlist/[[type]]', '/users/sean/watchlist', { id: 'sean' });

      expect(meta(html, 'og:title')).toBe("Sean Smith's watchlist");
      expect(meta(html, 'og:description')).toBe('Movies, shows, seasons, and episodes I plan to watch.');
      expect(meta(html, 'robots')).toBe('noindex, follow');
    });

    it("should title a list's comments by the list, from one read of it", async () => {
      const { html } = await preview(
        '/users/[id]/lists/[list]/comments',
        '/users/sean/lists/heist-night/comments',
        params,
      );

      expect(reads).toEqual(['/users/sean', '/users/sean/lists/heist-night']);
      expect(meta(html, 'og:title')).toBe('All comments for Heist Night');
      expect(meta(html, 'og:description')).toBe('Crews.');
    });

    it("should title a watchlist's comments without reading the list", async () => {
      const { html } = await preview('/users/[id]/watchlist/comments', '/users/sean/watchlist/comments', {
        id: 'sean',
      });

      expect(reads).toEqual(['/users/sean']);
      expect(meta(html, 'og:title')).toBe("All comments for Sean Smith's Watchlist");
    });

    it('should describe a smart list by where it fills itself from', async () => {
      server.use(
        http.get(`${API}/users/sean/smart-lists/horror-night`, () =>
          HttpResponse.json({
            name: 'Horror Night',
            privacy: 'public',
            source: 'trending',
            media_type: 'movies',
            filters: {},
            updated_at: '2026-01-01T00:00:00.000Z',
            ids: { trakt: 9, slug: 'horror-night' },
            images: { posters: [] },
          }),
        ),
      );

      const { html } = await preview('/users/[id]/smart-lists/[slug]', '/users/sean/smart-lists/horror-night', {
        id: 'sean',
        slug: 'horror-night',
      });

      expect(meta(html, 'og:title')).toBe('Horror Night');
      expect(meta(html, 'og:description')).toBe('A smart list that fills itself from Trending movies on Trakt.');
    });

    it('should head an official list from its summary and first items', async () => {
      server.use(
        http.get(`${API}/lists/trakt-picks`, () =>
          HttpResponse.json(
            listSummary({ type: 'official', ids: { trakt: 55, slug: 'trakt-picks' }, name: 'Trakt Picks' }),
          ),
        ),
        http.get(`${API}/lists/55/items*`, () => HttpResponse.json([movieRow(1)], { headers: itemsHeaders })),
      );

      const { html } = await preview('/lists/official/[slug]', '/lists/official/trakt-picks', { slug: 'trakt-picks' });

      expect(reads).toEqual(['/lists/trakt-picks', '/lists/55/items']);
      expect(meta(html, 'og:title')).toBe('Trakt Picks');
      expect(meta(html, 'og:image')).toBe('https://og.trakt.tv/api/art/movie/1/fanart/movie/1/poster');
    });
  });
});
