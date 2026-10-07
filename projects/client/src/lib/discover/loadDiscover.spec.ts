import { http, HttpResponse, type JsonBodyType } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { DISCOVER_MOODS } from './discoverMoods.ts';
import { loadDiscover } from './loadDiscover.ts';

const art = (id: number) => ({
  poster: [`media.trakt.tv/images/${id}/posters/medium/a.jpg.webp`],
  fanart: [`media.trakt.tv/images/${id}/fanarts/medium/a.jpg.webp`],
});
const show = (id: number) => ({
  title: `Show ${id}`,
  year: 2020,
  ids: { trakt: id, slug: `show-${id}` },
  images: art(id),
});
const movie = (id: number) => ({
  title: `Movie ${id}`,
  year: 2020,
  ids: { trakt: id, slug: `movie-${id}` },
  images: art(id),
});
const list = (id: number, name: string, items = 50) => ({
  ids: { trakt: id },
  name,
  item_count: items,
  likes: id,
  images: { posters: [] },
  user: { username: 'sean' },
});

const seen: Request[] = [];
const json = (body: JsonBodyType) => ({ request }: { request: Request }) => {
  seen.push(request);
  return HttpResponse.json(body);
};
// Theme calls carry `subgenres`; the mood shelves don't.
const themed = (request: Request) => new URL(request.url).searchParams.has('subgenres');

const server = setupServer(
  http.get('https://apiz.trakt.tv/movies/trending', ({ request }) => {
    seen.push(request);
    return HttpResponse.json(
      themed(request) ? [{ watchers: 9, movie: movie(7) }] : [{ watchers: 3, movie: movie(20) }],
    );
  }),
  http.get('https://apiz.trakt.tv/shows/trending', ({ request }) => {
    seen.push(request);
    return HttpResponse.json(themed(request) ? [] : [{ watchers: 3, show: show(21) }]);
  }),
  http.get('https://apiz.trakt.tv/movies/watched/weekly', json([{ watcher_count: 9, movie: movie(30) }])),
  http.get('https://apiz.trakt.tv/shows/watched/weekly', json([{ watcher_count: 9, show: show(31) }])),
  http.get('https://apiz.trakt.tv/movies/favorited/all', json([{ user_count: 9, movie: movie(8) }])),
  http.get('https://apiz.trakt.tv/shows/favorited/all', json([{ user_count: 9, show: show(9) }])),
  http.get(
    'https://apiz.trakt.tv/lists/trending',
    json([
      { like_count: 5, list: list(2_142_753, 'IMDB: Top Rated Movies') },
      { like_count: 4, list: list(10, 'Popular Horror') },
    ]),
  ),
  // After the trending route, so it doesn't catch it. IMDB's TV list fails, to show its slice keeps its art.
  http.get('https://apiz.trakt.tv/lists/:id', ({ request, params }) => {
    seen.push(request);
    return params.id === '2143363'
      ? new HttpResponse(null, { status: 500 })
      : HttpResponse.json(list(Number(params.id), 'Essential', 250));
  }),
  http.get(
    'https://apiz.trakt.tv/search/list',
    json([
      { type: 'list', score: 1, list: list(10, 'Popular Horror') },
      { type: 'list', score: 1, list: list(12, 'Horror') },
      { type: 'list', score: 1, list: list(13, 'Tiny', 3) },
      { type: 'list', score: 1, list: list(14, 'Horror Classics') },
    ]),
  ),
  http.get(
    'https://apiz.trakt.tv/comments/trending/all/all',
    json([
      {
        type: 'episode',
        comment: {
          id: 50,
          parent_id: 0,
          created_at: '2026-10-05T00:00:00.000Z',
          updated_at: '2026-10-05T00:00:00.000Z',
          comment: 'Loved it.',
          spoiler: false,
          review: false,
          replies: 2,
          likes: 30,
          user_stats: { rating: 9, play_count: 1, completed_count: 1 },
          user: { username: 'sean', ids: { slug: 'sean', trakt: 1 } },
        },
        show: show(40),
        episode: { season: 1, number: 8, title: 'Finale' },
      },
    ]),
  ),
  http.get(
    'https://apiz.trakt.tv/calendars/releases/hot/premieres/:start/:days',
    json([
      {
        first_aired: '2026-10-09T01:00:00.000Z',
        episode: { season: 1, number: 1, episode_type: 'series_premiere', ids: { trakt: 60 } },
        show: { ...show(60), votes: 500 },
      },
    ]),
  ),
  http.get('https://apiz.trakt.tv/shows/anticipated', json([{ list_count: 8000, show: show(60) }])),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'America/New_York', weekStartDay: 1 } as const;
const load = (now = '2026-10-07T16:00:00Z') =>
  loadDiscover({ fetch: globalThis.fetch, parent: () => Promise.resolve({ datePreferences }), now: new Date(now) });

describe('loadDiscover', () => {
  it("should pick the theme for the viewer's day and mark its month on the ribbon", async () => {
    const data = await load();

    expect(data.theme).toEqual({ id: 'halloween', title: '31 Nights of Horror', blurb: expect.any(String) });
    expect(data.ribbon.filter(({ daysLeft }) => daysLeft !== undefined).map(({ month }) => month)).toEqual(['Oct']);
  });

  it('should switch themes on the date in the viewer’s time zone', async () => {
    // Still Oct 31 in New York.
    expect((await load('2026-11-01T02:00:00Z')).theme.id).toBe('halloween');
    expect((await load('2026-11-01T16:00:00Z')).theme.id).toBe('comfort-food');
  });

  it("should ask for the theme's trending and all-time favorites with its filters", async () => {
    const data = await load();

    const paths = seen.filter(themed).map((request) => new URL(request.url).pathname).toSorted();
    expect(paths).toEqual(['/movies/favorited/all', '/movies/trending', '/shows/favorited/all', '/shows/trending']);
    for (const request of seen.filter(themed)) expect(new URL(request.url).searchParams.get('genres')).toBe('horror');
    expect(data.picks.map(({ key }) => key)).toEqual(['movie-7', 'movie-8', 'show-9']);
  });

  it("should put the season's chip first, then every year-round mood", async () => {
    const data = await load();

    // Anime has no movies' version, so it's a shows chip only.
    expect(data.moods.movie.map(({ id }) => id)).toEqual([
      'season',
      'short',
      'most-watched',
      'top-rated',
      'comedies',
      'family',
    ]);
    expect(data.moods.show.map(({ id }) => id)).toEqual(['season', ...DISCOVER_MOODS.map(({ id }) => id)]);
    expect(data.moods.movie.at(0)).toMatchObject({ label: '31 Nights of Horror' });
    expect(data.moods.movie.at(0)?.items.map(({ key }) => key)).toEqual(['movie-7', 'movie-8']);
    expect(data.moods.show.at(0)?.items.map(({ key }) => key)).toEqual(['show-9']);
    expect(data.moods.show.find(({ id }) => id === 'short')).toMatchObject({ label: 'Under 30 Minutes' });
    const short = seen.find((request) => new URL(request.url).searchParams.get('runtimes') === '60-95');
    expect(short && new URL(short.url).pathname).toBe('/movies/trending');
  });

  it("should keep the theme's lists with their week's likes, without the essentials or short lists", async () => {
    const data = await load();

    expect(data.lists.map(({ name, weekLikes }) => [name, weekLikes])).toEqual([
      ['Popular Horror', 4],
      ['Horror', 0],
      ['Horror Classics', 0],
    ]);
    const search = seen.find((request) => new URL(request.url).pathname === '/search/list');
    expect(search && new URL(search.url).searchParams.get('query')).toBe('horror');
  });

  it('should load every essential list, keeping the art of one that fails', async () => {
    const data = await load();

    expect(data.essentials.map(({ id, counts }) => [id, counts?.items])).toEqual([
      [2_142_753, 250],
      [2_143_363, undefined],
      [1_248_149, 250],
      [2_233_867, 250],
      [832_943, 250],
      [5_790_552, 250],
      [1_257_909, 250],
      [1_402_475, 250],
    ]);
    expect(data.essentials[1]).toMatchObject({ href: '/lists/2143363', logo: expect.stringMatching(/logo\.png$/) });
  });

  it('should link each mood to its chart', async () => {
    const data = await load();

    expect(data.moods.movie.map(({ id, more }) => [id, more])).toEqual([
      ['season', '/movies/trending?genres=horror'],
      ['short', '/movies/trending?runtimes=60-95'],
      ['most-watched', '/movies/watched/weekly'],
      ['top-rated', '/movies/trending?ratings=80-100'],
      ['comedies', '/movies/trending?genres=comedy'],
      ['family', '/movies/trending?genres=family'],
    ]);
    expect(data.moods.show.find(({ id }) => id === 'top-rated')?.more).toBe('/shows/trending?ratings=85-100');
  });

  it('should load the trending comments and the upcoming premieres from today', async () => {
    const data = await load();

    expect(data.comments.map(({ href, item }) => [href, item.title, item.episode?.number, item.episode?.title]))
      .toEqual([
        ['/comments/50', 'Show 40', '1x08', 'Finale'],
      ]);
    expect(seen.some((request) => new URL(request.url).pathname === '/calendars/releases/hot/premieres/2026-10-07/60'))
      .toBe(true);
    expect(data.premieres.map(({ title, kind, lists, day }) => [title, kind, lists, day])).toEqual([
      ['Show 60', 'series', 8000, '2026-10-08'],
    ]);
  });

  it('should go without a token', async () => {
    await load();

    expect(seen.every((request) => request.headers.get('authorization') === null)).toBe(true);
  });

  it('should hide only what fails', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/movies/trending', () => new HttpResponse(null, { status: 500 })),
      http.get('https://apiz.trakt.tv/movies/favorited/all', () => new HttpResponse(null, { status: 500 })),
      http.get('https://apiz.trakt.tv/shows/favorited/all', () => HttpResponse.json({ not: 'a list' })),
      http.get('https://apiz.trakt.tv/search/list', () => new HttpResponse(null, { status: 500 })),
    );

    const data = await load();
    expect(data.picks).toEqual([]);
    // Only the most watched, from its own chart, survives the movie trending chart failing.
    expect(data.moods.movie.map(({ id }) => id)).toEqual(['most-watched']);
    expect(data.moods.show.map(({ id }) => id)).toEqual([
      'short',
      'most-watched',
      'top-rated',
      'comedies',
      'family',
      'anime',
    ]);
    expect(data.lists).toEqual([]);
  });
});
