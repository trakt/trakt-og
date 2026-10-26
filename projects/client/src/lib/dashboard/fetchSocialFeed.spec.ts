import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { isApiUnavailable } from '../api/isApiUnavailable.ts';
import { fetchRecentMembers, fetchSocialFeed, fetchSocialItems } from './fetchSocialFeed.ts';
import { socialFeedFixture } from './socialFeedFixture.ts';
import { socialWindows } from './socialWindows.ts';

const FEED = 'https://apiz.trakt.tv/v3/users/me/following/activities';
const now = new Date('2026-09-30T12:00:30.500Z');
const seen: URL[] = [];
const server = setupServer();
const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const fetch = (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args);
const feed = (following: number | null = 3) =>
  fetchSocialFeed({ fetch, token: 'abc', following: Promise.resolve(following), now, datePreferences });
const get = (path: string) => fetch(`https://apiz.trakt.tv${path}`);

// Answers each window with the fixture rows that fall inside it, like the worker.
const byWindow = (rows = socialFeedFixture.rows(now)) =>
  http.get(FEED, ({ request }) => {
    const url = new URL(request.url);
    seen.push(url);
    const start = Date.parse(url.searchParams.get('start_at') ?? '');
    const end = Date.parse(url.searchParams.get('end_at') ?? '');
    return HttpResponse.json(
      rows.filter(({ activity_at }) => {
        const at = Date.parse(activity_at);
        return at >= start && at <= end;
      }),
    );
  });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

describe('fetchSocialFeed', () => {
  it('should ask for every kind of row in the last 24 hours, a full page at a time', async () => {
    server.use(byWindow());

    const social = await feed();
    const [first] = seen;

    expect(seen).toHaveLength(1);
    expect(first?.searchParams.has('action')).toBe(false);
    expect(first?.searchParams.get('limit')).toBe('250');
    expect(first?.searchParams.get('page')).toBe('1');
    expect(first?.searchParams.get('extended')).toBe('full,images');
    expect(first?.searchParams.get('end_at')).toBe('2026-09-30T12:00:00.000Z');
    expect(first?.searchParams.get('start_at')).toBe('2026-09-29T12:00:00.000Z');
    expect(social.follows).toBe(true);
    expect(social.items.at(0)?.key).toBe('watch:17');
    expect(social.items.some(({ key }) => key === 'comment:18')).toBe(false);
  });

  it('should list who to ask about watching now, most recently active first', async () => {
    server.use(byWindow());

    const social = await feed();

    expect(social.recent.map(({ name }) => name)).toEqual([
      'Kristin',
      'Sefer',
      'Damien',
      'MajorMercyFlush',
      'Technicolour',
      'Justin',
    ]);
  });

  it('should page on when the window has more rows than a page holds', async () => {
    const [first] = socialFeedFixture.rows(now);
    server.use(
      http.get(FEED, ({ request }) => {
        const url = new URL(request.url);
        seen.push(url);
        const page = Number(url.searchParams.get('page'));
        return HttpResponse.json([{ ...first, id: page }], { headers: { 'x-pagination-page-count': '3' } });
      }),
    );

    const social = await feed();

    expect(seen.map((url) => url.searchParams.get('page'))).toEqual(['1', '2', '3']);
    expect(social.items).toHaveLength(3);
  });

  it('should not ask when the viewer follows nobody, since the worker would send the team instead', async () => {
    server.use(byWindow());

    expect(await feed(0)).toEqual({ follows: false, items: [], recent: [] });
    expect(seen).toHaveLength(0);
  });

  it("should still ask when the following count didn't load", async () => {
    server.use(byWindow());

    expect((await feed(null)).recent).toHaveLength(6);
  });

  it('should skip a row it cannot show', async () => {
    const [first] = socialFeedFixture.rows(now);
    server.use(http.get(FEED, () => HttpResponse.json([first, { id: 2, action: 'watch', type: 'movie' }])));

    expect((await feed()).items.map(({ key }) => key)).toEqual(['watch:17']);
  });

  it('should reject a failed or malformed feed, so the panel shows its own error', async () => {
    server.use(http.get(FEED, () => new HttpResponse(null, { status: 500 })));
    await expect(feed()).rejects.toThrow('500');

    server.use(http.get(FEED, () => HttpResponse.json({ nope: true })));
    await expect(feed()).rejects.toThrow('invalid');
  });

  it('should reject as unavailable when the client ID may not call the feed', async () => {
    server.use(http.get(FEED, () => new HttpResponse('Forbidden', { status: 403 })));

    const failure: unknown = await feed().catch((cause: unknown) => cause);

    expect(isApiUnavailable(failure)).toBe(true);
  });
});

describe('fetchRecentMembers', () => {
  it("should read who was active from the last 24 hours' newest page only", async () => {
    const [first] = socialFeedFixture.rows(now);
    server.use(
      http.get(FEED, ({ request }) => {
        const url = new URL(request.url);
        seen.push(url);
        return HttpResponse.json([first], { headers: { 'x-pagination-page-count': '3' } });
      }),
    );

    const members = await fetchRecentMembers({ get, now, datePreferences });

    expect(seen.map((url) => url.searchParams.get('page'))).toEqual(['1']);
    expect(seen.at(0)?.searchParams.get('start_at')).toBe('2026-09-29T12:00:00.000Z');
    expect(members.map(({ name }) => name)).toEqual(['Kristin']);
  });

  it('should list each member once, most recently active first, like the Social Feed', async () => {
    server.use(byWindow());

    expect((await fetchRecentMembers({ get, now, datePreferences })).map(({ name }) => name)).toEqual(
      (await feed()).recent.map(({ name }) => name),
    );
  });
});

describe('fetchSocialItems', () => {
  it("should ask for each of the week's days and drop a row repeated on a window boundary", async () => {
    const [first] = socialFeedFixture.rows(now);
    server.use(
      http.get(FEED, ({ request }) => {
        seen.push(new URL(request.url));
        return HttpResponse.json([first]);
      }),
    );

    const items = await fetchSocialItems({ get, windows: socialWindows('week', now, 'UTC'), datePreferences });

    expect(seen).toHaveLength(7);
    expect(items.map(({ key }) => key)).toEqual(['watch:17']);
  });

  it('should keep the days that answered when another one fails', async () => {
    const [first] = socialFeedFixture.rows(now);
    server.use(
      http.get(FEED, ({ request }) => {
        seen.push(new URL(request.url));
        return seen.length === 1 ? HttpResponse.json([first]) : new HttpResponse(null, { status: 502 });
      }),
    );

    const items = await fetchSocialItems({ get, windows: socialWindows('week', now, 'UTC'), datePreferences });

    expect(items.map(({ key }) => key)).toEqual(['watch:17']);
  });

  it('should reject when every day fails', async () => {
    server.use(http.get(FEED, () => new HttpResponse(null, { status: 502 })));

    await expect(
      fetchSocialItems({ get, windows: socialWindows('week', now, 'UTC'), datePreferences }),
    ).rejects.toThrow('502');
  });
});
