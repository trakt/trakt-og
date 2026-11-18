import type { LastActivitiesResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { activityCacheStorage } from '../../activity/activityCacheStorage.ts';
import { createRecentReads } from '../../api/recentReads.ts';
import type { StatsCounts } from '../../stats/StatsCounts.ts';
import type { UserStats } from '../../stats/userStatsSchema.ts';
import { toProfileUser } from '../toProfileUser.ts';
import { startProfilePanels } from './startProfilePanels.ts';

const API = 'https://apiz.trakt.tv';
const now = new Date('2026-09-29T15:00:00Z');
const seen: Request[] = [];

const counts: StatsCounts = {
  watched: { movies: 2, shows: 0, episodes: 0 },
  plays: { movies: 3, episodes: 0 },
  ratings: {
    movies: 0,
    shows: 0,
    seasons: 0,
    episodes: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  },
  comments: { movies: 0, shows: 0, seasons: 0, episodes: 0 },
  lists: 0,
};
const full = (minutes: number) => ({ watched: 1, collected: 0, plays: 1, minutes, ratings: 0, comments: 0 });
const apiStats = {
  episodes: full(0),
  movies: full(120),
  shows: full(0),
  seasons: full(0),
  ratings: { total: 0, distribution: {} },
  progress: { started: 0, finished: 0, dropped: 0 },
  lists: 0,
} as unknown as UserStats;

const watchedMovie = (id: number, plays: number) => ({
  plays,
  last_watched_at: '2026-01-01T00:00:00.000Z',
  movie: { title: `Movie ${id}`, ids: { trakt: id, slug: `movie-${id}` }, runtime: 100 },
});
const play = (id: number) => ({
  id,
  watched_at: '2026-09-20T00:00:00.000Z',
  type: 'movie',
  movie: { title: `Movie ${id}`, ids: { trakt: id, slug: `movie-${id}` }, runtime: 100 },
});

const server = setupServer(
  http.get(/^https:\/\/apiz\.trakt\.tv\//, ({ request }) => {
    seen.push(request);
    const { pathname, searchParams } = new URL(request.url);
    if (pathname === '/users/tester/watched/movies' && searchParams.get('limit') !== '1') {
      return HttpResponse.json([watchedMovie(1, 2), watchedMovie(2, 5)]);
    }
    if (pathname === '/users/tester/history/movies' && searchParams.has('start_at')) {
      return HttpResponse.json([play(1)]);
    }
    return HttpResponse.json([], { headers: { 'X-Pagination-Item-Count': '0' } });
  }),
);
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
};
const activity = {
  all: '2026-09-28T00:00:00.000Z',
  movies: { watched_at: '2026-09-28T00:00:00.000Z' },
  episodes: { watched_at: '2026-09-28T00:00:00.000Z' },
  shows: { hidden_at: '2026-01-01T00:00:00.000Z', dropped_at: '2026-01-01T00:00:00.000Z' },
} as LastActivitiesResponse;

const signedIn: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', 'Bearer viewer-token');
  return globalThis.fetch(input, { ...init, headers });
};
const strip = { latest: {}, genres: [], counts };

type Options = {
  isSelf?: boolean;
  isPrivate?: boolean;
  stats?: UserStats | null;
  storage?: ReturnType<typeof memory>;
  recent?: ReturnType<typeof createRecentReads>;
  latest?: LastActivitiesResponse;
  onUpdate?: Parameters<typeof startProfilePanels>[0]['onUpdate'];
};

const start = ({
  isSelf = false,
  isPrivate = false,
  stats = null,
  storage = memory(),
  recent = createRecentReads(),
  latest = activity,
  onUpdate,
}: Options = {}) => {
  const activities = vi.fn(() => Promise.resolve(latest));
  const panels = startProfilePanels({
    profile: {
      ...toProfileUser({ username: 'tester', name: 'Tester', private: isPrivate, ids: { slug: 'tester' } }),
      isPrivate,
    },
    stats,
    isSelf,
    strip: { ...strip, counts: stats ? null : counts },
    prefs: null,
    now,
    signedIn,
    activities,
    onUpdate,
    cache: { storage: activityCacheStorage(storage) },
    memory: recent,
  });
  return { ...panels, activities, storage };
};

const droppedReads = () => seen.filter((request) => new URL(request.url).pathname === '/users/hidden/dropped');
const wholeLists = () =>
  seen.filter((request) => {
    const { pathname, searchParams } = new URL(request.url);
    return pathname === '/users/tester/watched/movies' && searchParams.get('limit') !== '1';
  });

describe('startProfilePanels', () => {
  describe("for someone else's public profile", () => {
    it('should read without a token and count the stats fresh, saving nothing', async () => {
      const { boxes, mostWatched, activities, storage } = start();
      const [loaded] = await Promise.all([boxes, mostWatched]);

      expect(seen.length).toBeGreaterThan(0);
      expect(seen.some((request) => request.headers.has('authorization'))).toBe(false);
      expect(activities).not.toHaveBeenCalled();
      expect(storage.getItem('og-activity')).toBeNull();
      expect(loaded?.find((box) => box.key === 'watch-time')?.view).toMatchObject({
        allTime: { movies: '2 movies' },
      });
      expect(droppedReads()).toHaveLength(0);
    });

    it('should keep the panels in memory, so opening it again reads nothing', async () => {
      const recent = createRecentReads();
      const first = start({ recent });
      await Promise.all([first.boxes, first.mostWatched]);
      const reads = seen.length;

      const second = start({ recent });
      await expect(second.mostWatched).resolves.toEqual(await first.mostWatched);
      await second.boxes;

      expect(seen).toHaveLength(reads);
    });

    it('should read every watched item for stats it counts itself, with the last 30 days alongside', async () => {
      const { mostWatched } = start();
      const loaded = await mostWatched;

      expect(new URL(wholeLists().at(0)?.url ?? '').searchParams.get('extended')).toBe('full');
      expect(loaded.movies.allTime.map(({ id }) => id)).toEqual([2, 1]);
      expect(loaded.movies.lastMonth.map(({ id }) => id)).toEqual([1]);
      expect(loaded.windowStart).toBe('2026-08-30T00:00:00.000Z');
    });
  });

  describe('for your own profile', () => {
    it('should read with your token, then show the saved panels without reading while your activity holds', async () => {
      const storage = memory();
      const first = start({ isSelf: true, storage });
      const loaded = await Promise.all([first.boxes, first.mostWatched]);

      expect(seen.every((request) => request.headers.get('authorization') === 'Bearer viewer-token')).toBe(true);
      expect(droppedReads()).toHaveLength(1);

      const onUpdate = vi.fn();
      const second = start({ isSelf: true, storage, onUpdate });
      await expect(Promise.all([second.boxes, second.mostWatched])).resolves.toEqual(loaded);
      await new Promise((resolve) => setTimeout(resolve));

      expect(droppedReads()).toHaveLength(1);
      expect(wholeLists()).toHaveLength(1);
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('should show the saved panels, then hand over fresh ones when your activity moved', async () => {
      const storage = memory();
      const first = start({ isSelf: true, storage });
      await Promise.all([first.boxes, first.mostWatched]);

      const onUpdate = vi.fn();
      const all = '2026-09-29T00:00:00.000Z';
      const moved = { ...activity, all, movies: { watched_at: all } } as LastActivitiesResponse;
      const second = start({ isSelf: true, storage, latest: moved, onUpdate });
      await Promise.all([second.boxes, second.mostWatched]);
      await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(2));

      expect(onUpdate).toHaveBeenCalledWith({ boxes: expect.any(Promise) });
      expect(onUpdate).toHaveBeenCalledWith({ mostWatched: expect.any(Promise) });
      expect(wholeLists()).toHaveLength(2);
    });

    it('should count again when your activity moved', async () => {
      const storage = memory();
      await start({ isSelf: true, storage }).boxes;
      const at = '2026-09-29T00:00:00.000Z';
      const moved = { ...activity, all: at, movies: { watched_at: at } } as LastActivitiesResponse;
      const again = startProfilePanels({
        profile: toProfileUser({ username: 'tester', name: 'Tester', private: false, ids: { slug: 'tester' } }),
        stats: null,
        isSelf: true,
        strip,
        prefs: null,
        now,
        signedIn,
        activities: () => Promise.resolve(moved),
        cache: { storage: activityCacheStorage(storage) },
      });
      await again.boxes;

      await vi.waitFor(() => expect(droppedReads()).toHaveLength(2));
    });

    it("should use the API's stats as they are, without counting", async () => {
      const { boxes } = start({ isSelf: true, stats: apiStats });
      await boxes;

      expect(droppedReads()).toHaveLength(0);
      expect(new URL(wholeLists().at(0)?.url ?? '').searchParams.get('extended')).toBe('full');
    });
  });

  describe("for someone else's private profile you can see", () => {
    it('should read with your token and not save the stats', async () => {
      const { boxes, mostWatched, activities, storage } = start({ isPrivate: true });
      await Promise.all([boxes, mostWatched]);

      expect(seen.every((request) => request.headers.get('authorization') === 'Bearer viewer-token')).toBe(true);
      expect(activities).not.toHaveBeenCalled();
      expect(storage.getItem('og-activity')).toBeNull();
    });
  });

  it('should fail both panels when the watched lists fail', async () => {
    server.use(http.get(`${API}/users/tester/watched/movies`, () => HttpResponse.error()));
    const { boxes, mostWatched } = start({ stats: apiStats });

    await expect(boxes).rejects.toThrow();
    await expect(mostWatched).rejects.toThrow();
  });

  it('should leave the boxes out when the strip does not show', async () => {
    const panels = startProfilePanels({
      profile: toProfileUser({ username: 'tester', name: 'Tester', private: false, ids: { slug: 'tester' } }),
      stats: apiStats,
      isSelf: false,
      strip: null,
      prefs: null,
      now,
      signedIn,
      activities: () => Promise.resolve(null),
      memory: createRecentReads(),
    });

    expect(await panels.boxes).toBeNull();
    expect((await panels.mostWatched).movies.allTime).toHaveLength(2);
  });
});
