import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { api } from '../api/api.ts';
import { workerUnauthorized } from '../api/workerUnauthorized.ts';
import { upNextFixture } from '../progress/upNextFixture.ts';
import type { DashboardSettings } from './DashboardSettings.ts';
import { fetchUpNext } from './fetchUpNext.ts';
import { toDashboardSettings } from './toDashboardSettings.ts';

const API = 'https://apiz.trakt.tv';
const UP_NEXT = `${API}/sync/progress/up_next_nitro`;
const seen: URL[] = [];
const server = setupServer();
const defaults = toDashboardSettings({ settings: null }).upNext;
const simple: DashboardSettings['upNext'] = { ...defaults, simpleProgress: true };
// Looked up per call: MSW swaps the global fetch once it listens.
const fetch = (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args);

const lost = upNextFixture.lifetime.find(({ show }) => show.title === 'Lost');
if (!lost) throw new Error('Missing fixture');

// Breaking Bad's progress: the first two episodes watched, the third skipped, the fourth watched. Lost, being
// rewatched, answers with its whole run.
const showProgress = http.get(`${API}/shows/:id/progress/watched`, ({ params, request }) => {
  seen.push(new URL(request.url));
  if (params.id === '1394') return HttpResponse.json({ ...lost.progress, seasons: [], hidden_seasons: [] });
  if (params.id !== '1388') return new HttpResponse(null, { status: 500 });
  return HttpResponse.json({
    aired: 4,
    completed: 3,
    seasons: [
      {
        number: 1,
        aired: 4,
        completed: 3,
        episodes: [true, true, false, true].map((completed, i) => ({ number: i + 1, completed })),
      },
    ],
    hidden_seasons: [],
  });
});

const seasons = http.get(`${API}/shows/:id/seasons`, ({ params, request }) => {
  seen.push(new URL(request.url));
  if (params.id !== '1390') return new HttpResponse(null, { status: 500 });
  return HttpResponse.json([
    { number: 1, ids: { trakt: 1 }, images: { poster: ['media.trakt.tv/images/seasons/1/posters/medium/a.jpg.webp'] } },
    { number: 3, ids: { trakt: 3 }, images: { poster: ['media.trakt.tv/images/seasons/3/posters/medium/c.jpg.webp'] } },
  ]);
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const answer = () =>
  http.get(UP_NEXT, ({ request }) => {
    seen.push(new URL(request.url));
    return HttpResponse.json(upNextFixture.entries);
  });
const upNextCalls = () => seen.filter(({ pathname }) => pathname === '/sync/progress/up_next_nitro');
const progressCalls = () => seen.filter(({ pathname }) => pathname.endsWith('/progress/watched'));

describe('fetchUpNext', () => {
  it('should ask for 18 shows in the default sort', async () => {
    server.use(answer(), showProgress);

    const items = await fetchUpNext({ api: api({ token: 'abc' }), username: 'sean', settings: simple });

    expect(items.map(({ showTitle }) => showTitle)).toEqual(upNextFixture.entries.map(({ show }) => show.title));
    expect(seen.at(0)?.searchParams.get('limit')).toBe('18');
    expect(seen.at(0)?.searchParams.get('sort_by')).toBe('default');
    expect(seen.at(0)?.searchParams.get('sort_how')).toBe('desc');
    expect(seen.at(0)?.searchParams.get('intent')).toBe('all');
  });

  it("should fetch the whole show's progress for each rewatch, and nothing else", async () => {
    server.use(answer(), showProgress);

    const items = await fetchUpNext({ api: api({ token: 'abc' }), username: 'sean', settings: simple });

    expect(upNextCalls()).toHaveLength(1);
    expect(upNextCalls().at(0)?.searchParams.has('lifetime_stats')).toBe(false);
    expect(progressCalls().map(({ pathname }) => pathname)).toEqual(['/shows/1394/progress/watched']);
    expect(items.find(({ showTitle }) => showTitle === 'Lost')?.fullProgress).toEqual({
      aired: 118,
      completed: 118,
      plays: 123,
      minutesWatched: 123 * 43,
      minutesLeft: 0,
    });
  });

  it("should skip the whole show's progress with no rewatch", async () => {
    const entries = upNextFixture.entries.filter(({ progress }) => !progress.reset_at);
    server.use(
      http.get(UP_NEXT, ({ request }) => {
        seen.push(new URL(request.url));
        return HttpResponse.json(entries);
      }),
    );

    await fetchUpNext({ api: api({ token: 'abc' }), username: 'sean', settings: simple });

    expect(seen).toHaveLength(1);
  });

  it("should still show a rewatch when its whole show's progress fails", async () => {
    server.use(
      answer(),
      http.get(`${API}/shows/:id/progress/watched`, () => new HttpResponse(null, { status: 500 })),
    );

    const items = await fetchUpNext({ api: api({ token: 'abc' }), username: 'sean', settings: simple });
    const lost = items.find(({ showTitle }) => showTitle === 'Lost');

    expect(lost?.rewatching).toBe(true);
    expect(lost?.fullProgress).toBeUndefined();
  });

  it("should fail the panel with the status of a stale token's plain-text 401", async () => {
    server.use(http.get(UP_NEXT, () => workerUnauthorized()));

    await expect(fetchUpNext({ api: api({ token: 'abc' }), username: 'sean', settings: simple })).rejects.toThrow(
      'Up Next failed with 401',
    );
  });

  describe('with the saved sort', () => {
    const sorted = async (sort: DashboardSettings['upNext']['sort'], favorites = 0) => {
      server.use(answer(), showProgress);
      return await fetchUpNext({
        api: api({ token: 'abc' }),
        username: 'sean',
        settings: { ...simple, sort, favorites },
      });
    };

    it("should hand the worker the sorts it has, in OG's directions", async () => {
      await sorted({ by: 'title', how: 'desc', title: 'Title' });
      await sorted({ by: 'premiered', how: 'asc', title: 'Premiere Date' });
      await sorted({ by: 'total-runtime', how: 'desc', title: 'Total Runtime' });
      await sorted({ by: 'episodes', how: 'asc', title: 'Episodes Left' });

      const firsts = upNextCalls();
      expect(firsts.map(({ searchParams }) => [searchParams.get('sort_by'), searchParams.get('sort_how')])).toEqual([
        ['title', 'desc'],
        ['released', 'desc'],
        ['runtime', 'asc'],
        ['remaining', 'asc'],
      ]);
      expect(firsts.every(({ searchParams }) => searchParams.get('limit') === '18')).toBe(true);
    });

    it("should sort the ones it doesn't have from a bigger page", async () => {
      const items = await sorted({ by: 'completed', how: 'asc', title: 'Completion %' });

      expect(seen.at(0)?.searchParams.get('limit')).toBe('100');
      expect(seen.at(0)?.searchParams.get('sort_by')).toBe('default');
      const percents = items.map(({ progress }) => progress.completed / progress.aired);
      expect(percents).toEqual(percents.toSorted((a, b) => b - a));
    });

    it('should only ask for shows on favorite services with that setting', async () => {
      await sorted(defaults.sort, 3);

      expect(seen.at(0)?.searchParams.get('watchnow')).toBe('favorites');
    });

    it('should not filter by services without it', async () => {
      await sorted(defaults.sort);

      expect(seen.at(0)?.searchParams.has('watchnow')).toBe(false);
    });
  });

  describe('with exact progress bars', () => {
    it("should tick each aired episode from the show's progress, and keep the plain bar when that fails", async () => {
      server.use(answer(), showProgress);

      const items = await fetchUpNext({ api: api({ token: 'abc' }), username: 'sean', settings: defaults });

      expect(items.find(({ showId }) => showId === 1388)?.ticks).toEqual([true, true, false, true]);
      expect(items.find(({ showId }) => showId === 1390)?.ticks).toBeUndefined();
    });

    it("should leave a rewatch's bar plain, since the show progress leaves its run out", async () => {
      server.use(answer(), showProgress);

      const items = await fetchUpNext({ api: api({ token: 'abc' }), username: 'sean', settings: defaults });
      const rewatch = items.find(({ showTitle }) => showTitle === 'Lost');

      expect(rewatch?.ticks).toBeUndefined();
      expect(rewatch?.fullProgress?.completed).toBe(118);
      expect(progressCalls()).toHaveLength(items.length);
    });

    it('should only ask for the rewatch with the standard bar', async () => {
      server.use(answer(), showProgress);

      await fetchUpNext({ api: api({ token: 'abc' }), username: 'sean', settings: simple });

      expect(seen.filter(({ pathname }) => pathname.includes('/shows/')).map(({ pathname }) => pathname)).toEqual([
        '/shows/1394/progress/watched',
      ]);
    });
  });

  describe('with the season poster', () => {
    it("should use the next episode's season poster, and the show's when there's none", async () => {
      server.use(answer(), showProgress, seasons);

      const items = await fetchUpNext({
        api: api({ token: 'abc' }),
        username: 'sean',
        settings: { ...simple, poster: 'season' },
        fetch,
      });

      expect(items.find(({ showId }) => showId === 1390)?.poster).toBe(
        'https://media.trakt.tv/images/seasons/3/posters/thumb/c.jpg.webp',
      );
      expect(items.find(({ showId }) => showId === 1388)?.poster).toBeUndefined();
      const seasonRequests = seen.filter(({ pathname }) => pathname.endsWith('/seasons'));
      expect(seasonRequests.every(({ searchParams }) => searchParams.get('extended') === 'images')).toBe(true);
    });
  });
});
