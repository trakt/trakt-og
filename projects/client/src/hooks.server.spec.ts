import { readFileSync } from 'node:fs';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { handle } from './hooks.server.ts';
import { load } from './routes/+layout.server.ts';

const APP_HTML = readFileSync(new URL('./app.html', import.meta.url), 'utf8');

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

type Handle = Parameters<typeof handle>[0];

const pageEvent = (cookie: string | undefined) =>
  ({
    cookies: { get: (name: string) => (name === 'og-auth' ? cookie : undefined) },
    locals: {},
    platform: { env: { OG_ADMIN_GATE: 'off' } },
    url: new URL('https://og.trakt.tv/shows/trending'),
    request: new Request('https://og.trakt.tv/shows/trending'),
  }) as unknown as Handle['event'];

const layoutLoad = (event: Handle['event']) =>
  load({ ...event, fetch: (...args) => globalThis.fetch(...args) } as Parameters<typeof load>[0]);

const authCookie = (expiresAt: number) => JSON.stringify({ token: 'viewer-token', expiresAt });

/** A page request through the hook: the root layout loads, then the app shell renders. */
async function render(cookie: string | undefined) {
  const resolve: Handle['resolve'] = async (resolved, options) => {
    await layoutLoad(resolved);
    const html = await options?.transformPageChunk?.({ html: APP_HTML, done: true });
    return new Response(html);
  };

  const response = await handle({ event: pageEvent(cookie), resolve });
  return /<html[^>]*>/.exec(await response.text())?.at(0);
}

/** The root layout's data for a page request through the hook. */
async function session(cookie: string | undefined) {
  const loaded: Awaited<ReturnType<typeof load>>[] = [];
  const resolve: Handle['resolve'] = async (resolved) => {
    loaded.push(await layoutLoad(resolved));
    return new Response();
  };

  await handle({ event: pageEvent(cookie), resolve });
  return loaded.at(0);
}

const darkKnight = (value: string) =>
  server.use(
    http.get('https://apiz.trakt.tv/users/settings', () =>
      HttpResponse.json({
        user: {
          username: 'og_tester',
          name: 'OG Tester',
          vip: false,
          ids: { slug: 'og_tester' },
          images: { avatar: { full: '' } },
        },
        browsing: { dark_knight: value },
      }),
    ),
  );

describe('hooks: theme', () => {
  it('should serve the saved Dark Knight theme in the first response', async () => {
    darkKnight('true');
    expect(await render('viewer-token')).toBe('<html lang="en" data-theme="dark">');
    darkKnight('auto');
    expect(await render('viewer-token')).toBe('<html lang="en" data-theme="system">');
    darkKnight('false');
    expect(await render('viewer-token')).toBe('<html lang="en" data-theme="light">');
  });

  it('should read the token from a cookie that stores its expiry', async () => {
    darkKnight('false');
    expect(await render(authCookie(Date.now() + 60_000))).toBe('<html lang="en" data-theme="light">');
  });

  it('should serve Dark Knight, the default, when logged out or the token is refused', async () => {
    expect(await render(undefined)).toBe('<html lang="en" data-theme="dark">');
    server.use(http.get('https://apiz.trakt.tv/users/settings', () => new HttpResponse(null, { status: 401 })));
    expect(await render('stale-token')).toBe('<html lang="en" data-theme="dark">');
  });
});

describe('hooks: auth cookie', () => {
  it('should render signed in for a live token', async () => {
    darkKnight('true');
    const data = await session(authCookie(Date.now() + 60_000));
    expect(data?.hasSession).toBe(true);
    expect(data?.tokenExpired).toBe(false);
    expect(data?.user?.slug).toBe('og_tester');
  });

  it('should keep a session for an expired token without sending it to the API', async () => {
    const requests: Request[] = [];
    server.use(
      http.all('*', ({ request }) => {
        requests.push(request);
        return new HttpResponse(null, { status: 401 });
      }),
    );

    const data = await session(authCookie(Date.now() - 1));
    expect(data?.hasSession).toBe(true);
    expect(data?.tokenExpired).toBe(true);
    expect(data?.user).toBeNull();
    expect(requests).toEqual([]);
  });

  it('should keep reading a cookie that holds a bare token', async () => {
    darkKnight('true');
    const data = await session('viewer-token');
    expect(data?.tokenExpired).toBe(false);
    expect(data?.user?.slug).toBe('og_tester');
  });

  it('should have no session without the cookie', async () => {
    const data = await session(undefined);
    expect(data?.hasSession).toBe(false);
    expect(data?.tokenExpired).toBe(false);
  });
});
