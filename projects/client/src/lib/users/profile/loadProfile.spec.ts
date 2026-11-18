import type { UserStats } from '#lib/stats/userStatsSchema.ts';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { ViewerSettings } from '../../settings/ViewerSettings.ts';
import { toProfileUser } from '../toProfileUser.ts';
import { loadProfile } from './loadProfile.ts';

const profile = toProfileUser({ username: 'tester', name: 'Tester', private: false, ids: { slug: 'tester' } });
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const seen: Request[] = [];

const full = (minutes: number, collected = 0) => ({
  watched: 1,
  collected,
  plays: 1,
  minutes,
  ratings: 0,
  comments: 0,
});
const stats = (minutes: number) =>
  ({
    episodes: full(minutes),
    movies: full(0),
    shows: full(0),
    seasons: full(0),
    ratings: { total: 3, distribution: { '8': 3 } },
    progress: { started: 0, finished: 0, dropped: 0 },
    lists: 0,
  }) as unknown as UserStats;

const movie = (id: number, runtime: number) => ({
  id,
  watched_at: '2026-09-20T00:00:00.000Z',
  type: 'movie',
  movie: { title: `Movie ${id}`, ids: { trakt: id, slug: `movie-${id}` }, runtime },
});

const server = setupServer(
  http.get(/^https:\/\/apiz\.trakt\.tv\/users\/tester\//, ({ request }) => {
    seen.push(request);
    return HttpResponse.json([], { headers: { 'X-Pagination-Item-Count': '0' } });
  }),
);
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const genre = {
  play_count: 2,
  genre: { slug: 'drama', name: 'Drama' },
  percentage: 100,
  percentage_row: 100,
  movies: { play_count: 2, ids: [1, 2] },
  shows: { play_count: 0, ids: [] },
  episodes: { play_count: 0, ids: [] },
};

type Options = {
  stats?: UserStats | null;
  isSelf?: boolean;
  isPrivate?: boolean;
  isLocked?: boolean;
  settings?: ViewerSettings | null;
};

const load = (options: Options = {}) =>
  loadProfile({
    fetch: (...args) => globalThis.fetch(...args),
    locals: { token: 'viewer-token' },
    params: { id: 'tester' },
    parent: () =>
      Promise.resolve({
        profile: { ...profile, isPrivate: options.isPrivate ?? false, isLocked: options.isLocked ?? false },
        stats: options.stats === undefined ? stats(60) : options.stats,
        isSelf: options.isSelf ?? false,
        datePreferences,
        settings: options.settings ?? null,
      }),
  });

describe('loadProfile', () => {
  it('should read public sections without the token', async () => {
    const data = await load();

    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((request) => !request.headers.has('authorization'))).toBe(true);
    expect(data.panels?.strip).toMatchObject({ latest: {}, genres: [], counts: null });
    expect(data.welcome).toBe(false);
  });

  it("should leave the whole watched lists, the last 30 days and og's own stats to the browser", async () => {
    server.use(
      http.get('https://apiz.trakt.tv/users/tester/history/movies', () =>
        HttpResponse.json([movie(9, 100)], { headers: { 'X-Pagination-Item-Count': '1' } }),
      ),
    );
    const reads: URL[] = [];
    server.events.on('request:start', ({ request }) => reads.push(new URL(request.url)));
    const self = await load({ isSelf: true });
    const counting = await load({ stats: null });
    server.events.removeAllListeners('request:start');

    expect(self.panels?.strip).not.toBeNull();
    expect(counting.panels?.strip).toMatchObject({ counts: { watched: { movies: 0 } } });
    const wholeLists = reads.filter(
      ({ pathname, searchParams }) => /\/watched\/(movies|shows)$/.test(pathname) && searchParams.get('limit') !== '1',
    );
    expect(wholeLists).toEqual([]);
    expect(
      reads.filter(({ searchParams }) => searchParams.has('start_at') && searchParams.get('limit') !== '1'),
    ).toEqual([]);
    expect(reads.filter(({ pathname }) => /\/(progress|hidden)\//.test(pathname))).toEqual([]);
  });

  it("should show the ghost profile only on someone else's profile with nothing on it", async () => {
    expect(await load({ stats: stats(0) })).toMatchObject({ ghost: true, welcome: false });
    expect(await load({ stats: null })).toMatchObject({ ghost: true });
    expect(await load({ stats: stats(0), isSelf: true })).toMatchObject({ ghost: false, welcome: true });
    expect(await load()).toMatchObject({ ghost: false });

    server.use(http.get('https://apiz.trakt.tv/users/tester/watched/genres', () => HttpResponse.json([genre])));
    expect(await load({ stats: stats(0) })).toMatchObject({ ghost: false });
  });

  it('should show the welcome hero instead of the boxes on your own empty profile', async () => {
    expect(await load({ stats: stats(0), isSelf: true })).toMatchObject({ panels: { strip: null }, welcome: true });
    expect(await load({ stats: stats(0) })).toMatchObject({ panels: { strip: null }, welcome: false });
  });

  it('should read a private profile the viewer can see with the token, each section once', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/users/tester/history/movies', ({ request }) => {
        seen.push(request);
        if (!request.headers.has('authorization')) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json([movie(9, 100)]);
      }),
    );
    const data = await load({ isPrivate: true });

    expect(data.movies.map(({ id }) => id)).toEqual([9]);
    const latest = seen.filter((request) => new URL(request.url).pathname === '/users/tester/history/movies');
    expect(latest.flatMap((request) => request.headers.get('authorization') ?? [])).toEqual(['Bearer viewer-token']);
  });

  it('should build the charts from the watched genres and the ratings in the stats', async () => {
    server.use(http.get('https://apiz.trakt.tv/users/tester/watched/genres', () => HttpResponse.json([genre])));
    const data = await load();

    expect(data.charts?.genres).toMatchObject([{ slug: 'drama', counts: [{ value: '2', noun: 'movies' }] }]);
    expect(data.charts?.ratings).toMatchObject({ count: '3', average: '8.00' });
  });

  it('should hide the charts without genres, or when a genres body is off contract', async () => {
    expect((await load()).charts).toBeNull();

    server.use(http.get('https://apiz.trakt.tv/users/tester/watched/genres', () => HttpResponse.json([{ bad: 1 }])));
    expect((await load()).charts).toBeNull();
  });

  describe("the owner's saved settings", () => {
    const settings = {
      browsing: {
        profile: {
          favorites: { sort_by: 'watched', sort_how: 'desc' },
          most_watched_shows: { sort_by: 'time', tab: 'all_time' },
          most_watched_movies: { sort_by: 'plays', tab: 'last_30_days' },
        },
      },
    } as unknown as ViewerSettings;
    const favoriteReads = () =>
      seen.filter((request) => new URL(request.url).pathname.startsWith('/users/tester/favorites/'));
    const favorite = (id: number) => ({
      rank: id,
      id,
      listed_at: '2026-01-01T00:00:00.000Z',
      notes: null,
      type: 'movie',
      movie: { title: `Movie ${id}`, year: 2020, ids: { trakt: id, slug: `movie-${id}` } },
    });

    it('should read your favorites in your saved order, with your token', async () => {
      server.use(
        http.get(/^https:\/\/apiz\.trakt\.tv\/users\/tester\/favorites\//, ({ request }) => {
          seen.push(request);
          const sorted = new URL(request.url).pathname.endsWith('/watched/desc');
          return HttpResponse.json([favorite(sorted ? 2 : 1)]);
        }),
      );
      const data = await load({ isSelf: true, settings });

      expect(favoriteReads().map((request) => new URL(request.url).pathname)).toEqual([
        '/users/tester/favorites/movie,show/watched/desc',
      ]);
      expect(favoriteReads().at(0)?.headers.get('authorization')).toBe('Bearer viewer-token');
      expect(data.favorites.map(({ id }) => id)).toEqual([2]);
    });

    it('should read the rest of your own public profile with your token too, so a watch just saved shows', async () => {
      await load({ isSelf: true, settings });
      const recent = seen.filter((request) => new URL(request.url).pathname.startsWith('/users/tester/history/'));
      expect(recent.length).toBeGreaterThan(0);
      expect(recent.at(-1)?.headers.get('authorization')).toBe('Bearer viewer-token');
    });

    it('should hand the browser your most watched sorts and default tabs', async () => {
      const data = await load({ isSelf: true, settings });
      expect(data.panels?.prefs).toMatchObject({
        most_watched_shows: { sort_by: 'time', tab: 'all_time' },
        most_watched_movies: { sort_by: 'plays', tab: 'last_30_days' },
      });
    });

    it("should give another viewer OG's defaults, whatever the viewer saved", async () => {
      const data = await load({ settings });

      expect(favoriteReads().map((request) => new URL(request.url).pathname)).toEqual([
        '/users/tester/favorites/movie,show/random/asc',
      ]);
      expect(data.panels?.prefs).toBeNull();
    });

    it("should read your private profile's favorites once, in your saved order, with your token", async () => {
      await load({ isSelf: true, isPrivate: true, settings });
      const tokened = favoriteReads().filter((request) => request.headers.has('authorization'));
      expect(tokened.map((request) => new URL(request.url).pathname)).toEqual([
        '/users/tester/favorites/movie,show/watched/desc',
      ]);
    });

    it('should read your favorites once with your token when you kept the random order', async () => {
      await load({ isSelf: true, settings: { browsing: {} } as unknown as ViewerSettings });
      const tokened = favoriteReads().filter((request) => request.headers.has('authorization'));
      expect(tokened.map((request) => new URL(request.url).pathname)).toEqual([
        '/users/tester/favorites/movie,show/random/asc',
      ]);
    });
  });

  it('should leave the charts and the browser panels out of a locked profile and never send the token', async () => {
    expect(await load({ isPrivate: true, isLocked: true })).toMatchObject({ charts: null, panels: null });
    expect(seen.every((request) => !request.headers.has('authorization'))).toBe(true);
  });

  describe('without stats from the API', () => {
    const counted = (path: string, count: number, rows: unknown[] = []) =>
      http.get(`https://apiz.trakt.tv/users/tester/${path}`, ({ request }) => {
        seen.push(request);
        return HttpResponse.json(rows, { headers: { 'X-Pagination-Item-Count': String(count) } });
      });

    it('should read the counts for the ratings chart and hand them to the browser', async () => {
      server.use(
        http.get('https://apiz.trakt.tv/users/tester/watched/genres', () => HttpResponse.json([genre])),
        counted('history/movies', 1, [movie(9, 100)]),
        counted('watched/movies', 1),
        counted('ratings/all/8', 3),
      );
      const data = await load({ stats: null });

      expect(data.panels?.strip).toMatchObject({ counts: { watched: { movies: 1 }, ratings: { movies: 0 } } });
      expect(data.charts?.ratings).toMatchObject({ count: '3', average: '8.00' });
      expect(data.welcome).toBe(false);
    });

    it("should show your own empty profile's welcome hero, and no boxes for anyone else's", async () => {
      expect(await load({ stats: null, isSelf: true })).toMatchObject({ panels: { strip: null }, welcome: true });
      expect(await load({ stats: null })).toMatchObject({ panels: { strip: null }, welcome: false });
    });

    it('should leave the boxes out when the counts fail', async () => {
      server.use(
        counted('history/movies', 1, [movie(9, 100)]),
        http.get('https://apiz.trakt.tv/users/tester/lists', () => new HttpResponse(null, { status: 503 })),
      );

      expect((await load({ stats: null })).panels?.strip).toBeNull();
    });
  });
});
