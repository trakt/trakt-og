import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { formatDate } from '../lib/utils/formatDate.ts';
import { load } from './+layout.server.ts';

const SETTINGS = {
  user: {
    username: 'og_tester',
    name: 'OG Tester',
    vip: true,
    ids: { slug: 'og_tester' },
    images: { avatar: { full: 'https://example.test/avatar.png' } },
  },
  account: { timezone: 'Asia/Tokyo', date_format: 'ydm', time_24hr: true },
  browsing: { week_start_day: '1', spoilers: { episodes: 'hide' } },
  sharing: { app: { comment_reply: false }, email: { comment_reply: true }, twitter: { profile: true } },
  limits: { notes: { item_count: 100 } },
};
const seen: Request[] = [];
const server = setupServer(
  http.get('https://apiz.trakt.tv/users/settings', ({ request }) => {
    seen.push(request);
    return HttpResponse.json(SETTINGS);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const request = (userAgent?: string) =>
  new Request('https://og.test/', { headers: userAgent ? { 'user-agent': userAgent } : {} });

const untrack = <T>(fn: () => T) => fn();

const layout = (
  token: string | null = 'fake-token',
  searchType?: string,
  userAgent?: string,
  klipyKey?: string,
  routeId = '/',
) =>
  load({
    fetch: globalThis.fetch,
    locals: { token, tokenExpired: false },
    cookies: { get: (name: string) => (name === 'search_type' ? searchType : undefined) },
    request: request(userAgent),
    route: { id: routeId },
    platform: { env: { KLIPY_API_KEY: klipyKey } },
    untrack,
  } as Parameters<typeof load>[0]);

/** Whether the load read `route.id` outside `untrack`, which reruns it on every client navigation to another route. */
const tracksRoute = async (routeId: string) => {
  let tracking = true;
  let tracked = false;
  await load({
    fetch: globalThis.fetch,
    locals: { token: 'fake-token', tokenExpired: false },
    cookies: { get: (_name: string): string | undefined => undefined },
    request: request(),
    route: {
      get id() {
        tracked ||= tracking;
        return routeId;
      },
    },
    untrack: <T>(fn: () => T) => {
      tracking = false;
      try {
        return fn();
      } finally {
        tracking = true;
      }
    },
  } as Parameters<typeof load>[0]);
  return tracked;
};

describe('root layout settings', () => {
  it('should load extended settings once and share them with the header and date helpers', async () => {
    const data = await layout();
    expect(seen).toHaveLength(1);
    const request = seen.at(0);
    expect(new URL(request?.url ?? '').searchParams.get('extended')).toBe('browsing,sharing');
    expect(request?.headers.get('authorization')).toBe('Bearer fake-token');
    expect(request?.headers.get('trakt-api-key')).toBe(TRAKT_CLIENT_ID);
    expect(data.hasSession).toBe(true);
    expect(data.settings).toEqual(SETTINGS);
    expect(data.user).toEqual({
      slug: 'og_tester',
      firstName: 'OG',
      isVip: true,
      avatarUrl: SETTINGS.user.images.avatar.full,
      joinedAt: null,
      named: true,
    });
    expect(data.datePreferences).toEqual({ order: 'ydm', hour24: true, timeZone: 'Asia/Tokyo', weekStartDay: 1 });
    expect(formatDate('2026-09-29T23:30:00Z', { ...data.datePreferences, time: true })).toBe('2026 30 Sep 08:30');
  });

  it('should preserve optional email and birthday when the API includes them', async () => {
    const user = { ...SETTINGS.user, email: 'tester@example.test', dob: '1990-01-01' };
    server.use(http.get('https://apiz.trakt.tv/users/settings', () => HttpResponse.json({ ...SETTINGS, user })));
    const data = await layout();
    expect(data.settings?.user.email).toBe(user.email);
    expect(data.settings?.user.dob).toBe(user.dob);
  });

  it('should render defaults without fetching when logged out', async () => {
    expect(await layout(null)).toEqual({
      hasSession: false,
      tokenExpired: false,
      rateLimited: false,
      user: null,
      settings: null,
      datePreferences: { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 },
      searchType: '',
      platform: 'ios',
      phone: false,
    });
    expect(seen).toHaveLength(0);
  });

  it.each(['/signin', '/callback', '/signout'])(
    'should skip the settings on %s, which draws no header',
    async (routeId) => {
      const data = await layout('fake-token', undefined, undefined, undefined, routeId);
      expect(data).toEqual({ ...(await layout(null)), hasSession: true });
      expect(seen).toHaveLength(0);
    },
  );

  it.each(['/', '/users/[id]', '/users/[id]/history/[[type=historyType]]/[...sort]'])(
    'should not rerun when a client navigation leaves %s, so child frames keep their data',
    async (routeId) => {
      expect(await tracksRoute(routeId)).toBe(false);
    },
  );

  it.each(['/signin', '/callback', '/signout'])('should rerun when a client navigation leaves %s', async (routeId) => {
    expect(await tracksRoute(routeId)).toBe(true);
  });

  it('should keep the session for an expired token, leaving the user to load once the browser renews it', async () => {
    const data = await load({
      fetch: globalThis.fetch,
      locals: { token: null, tokenExpired: true },
      cookies: { get: (_name: string): string | undefined => undefined },
      request: request(),
      route: { id: '/' },
      untrack,
    } as Parameters<typeof load>[0]);
    expect(data).toEqual({ ...(await layout(null)), hasSession: true, tokenExpired: true });
    expect(seen).toHaveLength(0);
  });

  it('should offer the GIF picker only where the Worker has a Klipy key', async () => {
    const withKey = await layout('fake-token', undefined, undefined, 'secret');
    const without = await layout();
    expect('gifs' in withKey && withKey.gifs).toBe(true);
    expect('gifs' in without && without.gifs).toBe(false);
  });

  it('should pass the search_type cookie to the header search', async () => {
    expect((await layout(null, 'people')).searchType).toBe('people');
    expect((await layout('fake-token', 'imdb')).searchType).toBe('imdb');
  });

  it.each([401, 403, 429, 500])(
    'should render logged-out defaults on %s while leaving renewal to the client',
    async (status) => {
      server.use(http.get('https://apiz.trakt.tv/users/settings', () => new HttpResponse(null, { status })));
      const data = await layout();
      expect(data).toEqual({ ...(await layout(null)), hasSession: true });
    },
  );

  it.each([
    ['a network error', () => HttpResponse.error()],
    ['invalid JSON', () => new HttpResponse('{', { headers: { 'Content-Type': 'application/json' } })],
    ['a malformed settings response', () => HttpResponse.json({ user: null })],
  ])('should render logged-out defaults for %s', async (_, response) => {
    server.use(http.get('https://apiz.trakt.tv/users/settings', response));
    expect(await layout()).toEqual({ ...(await layout(null)), hasSession: true });
  });

  it('should pick the mobile splash store from the user agent', async () => {
    const android = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36';
    expect((await layout(null, undefined, android)).platform).toBe('android');
    expect((await layout('fake-token', undefined, android)).platform).toBe('android');
    expect((await layout()).platform).toBe('ios');
  });

  it('should flag a phone user agent for the mobile splash wording', async () => {
    const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
    expect((await layout(null, undefined, iphone)).phone).toBe(true);
    expect((await layout()).phone).toBe(false);
  });

  it('should keep settings isolated between requests and clear them after logout', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/users/settings', ({ request }) => {
        const slug = request.headers.get('authorization') === 'Bearer first' ? 'first' : 'second';
        return HttpResponse.json({ ...SETTINGS, user: { ...SETTINGS.user, ids: { slug } } });
      }),
    );
    const [first, second] = await Promise.all([layout('first'), layout('second')]);
    expect(first.settings?.user.ids.slug).toBe('first');
    expect(second.settings?.user.ids.slug).toBe('second');
    expect((await layout(null)).settings).toBeNull();
  });
});

describe('root layout kept settings', () => {
  const entries = new Map<string, Response>();
  const cache = {
    match: (key: string) => Promise.resolve(entries.get(key)?.clone()),
    put: (key: string, response: Response) => Promise.resolve(void entries.set(key, response)),
    delete: (key: string) => Promise.resolve(entries.delete(key)),
  };
  afterEach(() => entries.clear());

  // One server run of the root layout: a full page load, or the data request of a client navigation or reload.
  const visit = ({ dataRequest = true, revision = '', token = 'fake-token' } = {}) =>
    load({
      fetch: globalThis.fetch,
      locals: { token, tokenExpired: false },
      cookies: { get: (name: string) => (name === 'og-settings' ? revision : undefined) },
      request: request(),
      isDataRequest: dataRequest,
      route: { id: '/' },
      platform: { env: {}, caches: { default: cache } },
      untrack,
    } as unknown as Parameters<typeof load>[0]);

  it('should read the settings once across a page load and its client navigations', async () => {
    await visit({ dataRequest: false });
    const navigations = await Promise.all([visit(), visit(), visit(), visit(), visit()]);

    expect(seen).toHaveLength(1);
    navigations.forEach((data) => expect(data.settings).toEqual(SETTINGS));
  });

  it('should read fresh on every full page load', async () => {
    await visit({ dataRequest: false });
    await visit({ dataRequest: false });

    expect(seen).toHaveLength(2);
  });

  it('should read fresh once og saves a setting, then keep the new copy', async () => {
    await visit({ dataRequest: false });
    await visit();
    const darkKnight = { ...SETTINGS, browsing: { ...SETTINGS.browsing, dark_knight: 'false' } };
    server.use(
      http.get('https://apiz.trakt.tv/users/settings', ({ request }) => {
        seen.push(request);
        return HttpResponse.json(darkKnight);
      }),
    );

    const saved = await visit({ revision: 'saved' });
    await visit({ revision: 'saved' });

    expect(saved.settings).toEqual(darkKnight);
    expect(seen).toHaveLength(2);
  });

  it('should read again for a renewed token', async () => {
    await visit({ dataRequest: false });
    await visit({ token: 'renewed-token' });

    expect(seen.map((request) => request.headers.get('authorization'))).toEqual([
      'Bearer fake-token',
      'Bearer renewed-token',
    ]);
  });

  it('should render a refused token logged out on a full page load and stop keeping its settings', async () => {
    await visit({ dataRequest: false });
    server.use(http.get('https://apiz.trakt.tv/users/settings', () => new HttpResponse(null, { status: 401 })));

    expect(await visit({ dataRequest: false })).toEqual({ ...(await layout(null)), hasSession: true });
    expect(await visit()).toEqual({ ...(await layout(null)), hasSession: true });
  });
});

describe('root layout theme', () => {
  // The theme the page's <html> renders with (hooks.server.ts writes it).
  const theme = async (token: string | null = 'fake-token') => {
    const locals: App.Locals = { token, tokenExpired: false, crawler: { verified: false, bot: false } };
    const cookies = { get: (_name: string): string | undefined => undefined };
    await load({
      fetch: globalThis.fetch,
      locals,
      cookies,
      request: request(),
      route: { id: '/' },
      untrack,
    } as Parameters<typeof load>[0]);
    return locals.theme;
  };
  const darkKnight = (value: unknown) =>
    server.use(
      http.get('https://apiz.trakt.tv/users/settings', () =>
        HttpResponse.json({ ...SETTINGS, browsing: { ...SETTINGS.browsing, dark_knight: value } }),
      ),
    );

  it.each([
    ['true', 'dark'],
    ['false', 'light'],
    ['auto', 'system'],
    ['', 'dark'],
  ])('should render dark_knight "%s" as the %s theme', async (value, expected) => {
    darkKnight(value);
    expect(await theme()).toBe(expected);
  });

  it('should leave the theme to the Dark Knight default when logged out or the settings fail', async () => {
    expect(await theme(null)).toBeUndefined();
    server.use(http.get('https://apiz.trakt.tv/users/settings', () => new HttpResponse(null, { status: 401 })));
    expect(await theme()).toBeUndefined();
    server.use(http.get('https://apiz.trakt.tv/users/settings', () => HttpResponse.json({ user: null })));
    expect(await theme()).toBeUndefined();
  });
});
