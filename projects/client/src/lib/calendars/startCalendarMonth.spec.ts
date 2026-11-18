import type { LastActivitiesResponse } from '@trakt/api';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { activityCacheStorage } from '../activity/activityCacheStorage.ts';
import { createRecentReads } from '../api/recentReads.ts';
import { parseAdvancedFilters } from '../components/filters/advancedFilters.ts';
import { fromFilterDraft, toFilterDraft } from '../components/filters/filterDraft.ts';
import { calendarFilters } from './calendarFilters.ts';
import { calendarWindow } from './calendarWindow.ts';
import { startCalendarMonth } from './startCalendarMonth.ts';

const API = 'https://apiz.trakt.tv';
const NOW = new Date('2026-09-29T12:00:00.000Z');

const show = (trakt: number, country = 'us') => ({
  title: `Show ${trakt}`,
  country,
  network: 'FX',
  ids: { trakt, slug: `show-${trakt}` },
});
const airing = (trakt: number, season: number, first_aired = '2026-09-30T01:00:00.000Z') => ({
  first_aired,
  show: show(trakt),
  episode: { season, number: 1, title: 'Pilot', ids: { trakt: trakt * 100 + season } },
});
const release = (trakt: number) => ({
  released: '2026-09-30',
  movie: { title: `Movie ${trakt}`, year: 2026, ids: { trakt, slug: `movie-${trakt}` } },
});
const hidden = [
  { hidden_at: '2026-01-01T00:00:00.000Z', type: 'show', show: { title: 'Show 2', ids: { trakt: 2 } } },
  { hidden_at: '2026-01-01T00:00:00.000Z', type: 'movie', movie: { title: 'Movie 8', ids: { trakt: 8 } } },
];

const seen: Request[] = [];
const server = setupServer(
  http.get(`${API}/calendars/:target/shows/:start/:days`, ({ request }) => {
    seen.push(request);
    return HttpResponse.json([airing(1, 1), airing(1, 0), airing(2, 1)]);
  }),
  http.get(`${API}/calendars/:target/movies/:start/:days`, ({ request }) => {
    seen.push(request);
    return HttpResponse.json([release(7), release(8)]);
  }),
  http.get(`${API}/users/hidden/calendar`, ({ request }) => {
    seen.push(request);
    return HttpResponse.json(hidden);
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

const stamps = (watched: string) => ({ movies: { watched_at: watched } }) as unknown as LastActivitiesResponse;
let activities: LastActivitiesResponse | null;

type Options = {
  slug?: 'shows-movies' | 'shows' | 'movies';
  search?: string;
  start?: string;
  hideSpecials?: boolean;
  timeZone?: string;
  period?: 'month';
  onUpdate?: (month: Awaited<ReturnType<typeof startCalendarMonth>>) => void;
  memory?: ReturnType<typeof createRecentReads>;
};

const start = ({
  slug = 'shows-movies',
  search = '',
  start,
  hideSpecials = false,
  timeZone = 'UTC',
  onUpdate,
  memory = createRecentReads(),
}: Options = {}) => {
  const window = calendarWindow({ start, today: '2026-09-29', period: 'month', layout: 'list', startDay: 'today' });
  const config = calendarFilters({ slug, now: NOW });
  const filters = fromFilterDraft(toFilterDraft(parseAdvancedFilters(new URLSearchParams(search)), config), config);
  return startCalendarMonth({
    fetch: globalThis.fetch.bind(globalThis),
    user: 'sean',
    slug,
    window,
    filters,
    timeZone,
    hideSpecials,
    activities: () => Promise.resolve(activities),
    onUpdate: onUpdate ?? (() => {}),
    now: NOW,
    memory,
  });
};

const keys = (days: Awaited<ReturnType<typeof start>>['days']) =>
  days.flatMap(({ items }) =>
    items.map((item) =>
      item.type === 'movie' ? `m${item.movie.ids.trakt}` : `${item.show.ids.trakt}s${item.episode.season}`,
    ),
  );

describe('startCalendarMonth', () => {
  beforeEach(() => {
    activities = stamps('t1');
    vi.stubGlobal('localStorage', memory());
  });
  afterEach(() => vi.unstubAllGlobals());

  it("should read the viewer's whole month and leave out what they hid", async () => {
    const month = await start();

    expect(month.days).toHaveLength(30);
    expect(keys(month.days)).toEqual(['m7', '1s1', '1s0']);
    expect(month.totals).toBeUndefined();
    expect(new URL(seen.find((r) => r.url.includes('/calendars/my/shows/'))?.url ?? '').pathname).toBe(
      '/calendars/my/shows/2026-08-30/33',
    );
    expect(seen.find((r) => r.url.includes('/users/hidden/calendar'))).toBeDefined();
  });

  it('should drop specials only with the setting on', async () => {
    expect(keys((await start({ slug: 'shows', hideSpecials: true })).days)).toEqual(['1s1']);
  });

  it("should put a US show on the viewer's own prime time", async () => {
    const month = await start({ slug: 'shows', timeZone: 'America/Los_Angeles', hideSpecials: true });
    const day = month.days.find(({ items }) => items.length > 0);

    expect(day?.date).toBe('2026-09-29');
    expect(day?.items.at(0)?.at).toBe('2026-09-30T04:00:00.000Z');
  });

  it('should show everything when the hidden items fail to load', async () => {
    server.use(http.get(`${API}/users/hidden/calendar`, () => new HttpResponse(null, { status: 500 })));

    expect(keys((await start({ slug: 'movies' })).days)).toEqual(['m7', 'm8']);
  });

  it('should send filters to the API, apply terms here and count the month without them', async () => {
    const month = await start({ slug: 'movies', search: '?query=Movie%207&genres=drama' });

    expect(keys(month.days)).toEqual(['m7']);
    expect(month.totals).toEqual({ episodes: 0, movies: 1 });
    const genres = seen
      .filter((request) => request.url.includes('/calendars/my/movies/'))
      .map((request) => new URL(request.url).searchParams.get('genres'));
    expect(genres).toEqual(['drama', null]);
  });

  it('should apply episode types here without sending them', async () => {
    const month = await start({ slug: 'shows', search: '?episode_types=-standard' });

    expect(keys(month.days)).toEqual([]);
    expect(seen.some((request) => new URL(request.url).searchParams.has('episode_types'))).toBe(false);
  });

  it("should fetch each day of a longer month once, since the worker's days=N covers N + 1 days", async () => {
    await start({ slug: 'shows', start: '2026-08-12' });
    const covered = seen
      .map((request) => new URL(request.url).pathname.split('/'))
      .filter((parts) => parts.at(3) === 'shows')
      .flatMap((parts) => {
        const from = new Date(`${parts.at(4)}T00:00:00Z`);
        return Array.from({ length: Number(parts.at(5)) + 1 }, (_, i) => {
          const day = new Date(from);
          day.setUTCDate(day.getUTCDate() + i);
          return day.toISOString().slice(0, 10);
        });
      });

    expect(new Set(covered).size).toBe(covered.length);
    expect(covered.length).toBeGreaterThan(33);
  });

  it('should reject when the calendar fails, for the page to show its failure state', async () => {
    server.use(http.get(`${API}/calendars/my/shows/:start/:days`, () => new HttpResponse(null, { status: 500 })));

    await expect(start({ slug: 'shows' })).rejects.toThrow();
  });

  it('should reject when the sign-in expired', async () => {
    server.use(http.get(`${API}/calendars/my/shows/:start/:days`, () => new HttpResponse(null, { status: 401 })));

    await expect(start({ slug: 'shows' })).rejects.toThrow('expired');
  });

  describe('when it was read before', () => {
    it('should show the saved month at once and read nothing while the activity holds', async () => {
      await start({ slug: 'movies' });
      seen.length = 0;
      const onUpdate = vi.fn<(month: Awaited<ReturnType<typeof start>>) => void>();

      expect(keys((await start({ slug: 'movies', onUpdate })).days)).toEqual(['m7']);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(seen).toHaveLength(0);
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('should swap in a fresh month once your activity moved', async () => {
      await start({ slug: 'movies' });
      server.use(http.get(`${API}/calendars/my/movies/:start/:days`, () => HttpResponse.json([release(9)])));
      activities = stamps('t2');
      const onUpdate = vi.fn<(month: Awaited<ReturnType<typeof start>>) => void>();

      expect(keys((await start({ slug: 'movies', onUpdate })).days)).toEqual(['m7']);
      await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
      expect(keys(onUpdate.mock.calls[0]?.[0].days ?? [])).toEqual(['m9']);
    });

    it('should never show another month, filter or setting in place of this one', async () => {
      await start({ slug: 'movies' });
      const october = { ...release(9), released: '2026-10-05' };
      server.use(http.get(`${API}/calendars/my/movies/:start/:days`, () => HttpResponse.json([october])));

      const other = [
        await start({ slug: 'movies', start: '2026-10-01' }),
        await start({ slug: 'movies', start: '2026-10-01', search: '?genres=drama' }),
      ];
      for (const { days } of other) expect(new Set(keys(days))).toEqual(new Set(['m9']));
    });

    it('should save only the month with today in it, one per calendar', async () => {
      await start({ slug: 'movies' });
      await start({ slug: 'movies', start: '2026-10-01' });
      await start({ slug: 'shows' });

      const saved = Object.keys(JSON.parse(localStorage.getItem('og-activity') ?? '{}')).toSorted();
      expect(saved).toEqual(['calendar-movies', 'calendar-shows']);
      expect(JSON.stringify(activityCacheStorage().load('calendar-movies', 'sean')?.key)).toContain('2026-09-01');
    });

    it('should keep another month in memory, so paging back to it reads nothing', async () => {
      const memory = createRecentReads();
      const october = { slug: 'movies', start: '2026-10-01', memory } as const;
      await start(october);
      seen.length = 0;

      await start(october);
      expect(seen).toHaveLength(0);

      memory.forget();
      await start(october);
      expect(seen.length).toBeGreaterThan(0);
    });
  });
});
