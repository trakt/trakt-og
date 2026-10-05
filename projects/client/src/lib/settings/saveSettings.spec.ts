import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { authenticatedFetch } from '../auth/authenticatedFetch.ts';
import { fakeUser } from '../auth/fakeUser.ts';
import { fakeUserManager } from '../auth/fakeUserManager.ts';
import { saveSettings } from './saveSettings.ts';
import { settingsRequest } from './settingsRequest.ts';

const API = 'https://apiz.trakt.tv';
const seen: Array<{ path: string; method: string; body: unknown; bearer: string | null }> = [];
const record = async (request: Request) => {
  seen.push({
    path: new URL(request.url).pathname,
    method: request.method,
    body: await request.json(),
    bearer: request.headers.get('authorization'),
  });
};
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

// Never capture globalThis.fetch itself: a reference taken before listen() skips MSW.
const passthrough: typeof fetch = (...args) => globalThis.fetch(...args);

function viewer(signinSilent?: () => Promise<ReturnType<typeof fakeUser> | null>) {
  const { manager } = fakeUserManager({ current: fakeUser('viewer-token', 3600), signinSilent });
  return settingsRequest(authenticatedFetch({ manager, baseFetch: passthrough }));
}

const body = { browsing: { dark_knight: 'true' } };

describe('saveSettings', () => {
  it('should send the body as the viewer', async () => {
    server.use(http.put(`${API}/users/settings`, async ({ request }) => {
      await record(request);
      return new HttpResponse(null, { status: 201 });
    }));

    expect(await saveSettings({ request: viewer(), body })).toEqual({ saved: true, errors: [] });
    expect(seen).toEqual([{ path: '/users/settings', method: 'PUT', body, bearer: 'Bearer viewer-token' }]);
  });

  it("should show API's validation message", async () => {
    server.use(
      http.put(
        `${API}/users/settings`,
        () => HttpResponse.json({ message: 'Dark knight is invalid' }, { status: 400 }),
      ),
    );

    expect(await saveSettings({ request: viewer(), body })).toEqual({
      saved: false,
      errors: ['Dark knight is invalid'],
    });
  });

  it('should retry a spent token once, then say the session expired', async () => {
    const bearers: Array<string | null> = [];
    server.use(http.put(`${API}/users/settings`, ({ request }) => {
      bearers.push(request.headers.get('authorization'));
      return new HttpResponse(null, { status: 401 });
    }));

    const result = await saveSettings({
      request: viewer(() => Promise.resolve(fakeUser('renewed-token', 3600))),
      body,
    });

    expect(bearers).toEqual(['Bearer viewer-token', 'Bearer renewed-token']);
    expect(result).toEqual({
      saved: false,
      errors: ['Your session has expired. Sign in again to save your settings.'],
    });
  });

  it('should fall back to a generic message for a server error or a network failure', async () => {
    const generic = { saved: false, errors: ["Trakt couldn't save your settings. Please try again."] };

    server.use(http.put(`${API}/users/settings`, () => new HttpResponse('oops', { status: 500 })));
    expect(await saveSettings({ request: viewer(), body })).toEqual(generic);

    server.use(http.put(`${API}/users/settings`, () => HttpResponse.error()));
    expect(await saveSettings({ request: viewer(), body })).toEqual(generic);
  });
});
