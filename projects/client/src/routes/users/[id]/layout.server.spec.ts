import { isHttpError, isRedirect } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { workerUnauthorized } from '../../../lib/api/workerUnauthorized.ts';
import { dashboardFrameFixture } from '../../../lib/dashboard/dashboardFrameFixture.ts';
import { load } from './+layout.server.ts';

const API = 'https://apiz.trakt.tv';
const PROFILE = { username: 'justin', private: false, name: 'Justin', ids: { slug: 'justin' } };
const STATS = { ...dashboardFrameFixture.newStats, network: { friends: 0, followers: 3, following: 4 } };

// Every native route answers a stale token with the worker's plain-text 401, public ones included.
const refusingStale =
  (answer: () => Response) =>
  ({ request }: { request: Request }) =>
    request.headers.get('authorization') === 'Bearer stale' ? workerUnauthorized() : answer();

const seen: Request[] = [];
const server = setupServer(
  http.get(`${API}/users/:id`, (info) => {
    seen.push(info.request);
    return refusingStale(() => HttpResponse.json(PROFILE))(info);
  }),
  http.get(
    `${API}/users/:id/stats`,
    refusingStale(() => HttpResponse.json(STATS)),
  ),
  http.get(
    `${API}/users/:id/watching`,
    refusingStale(() => new HttpResponse(null, { status: 204 })),
  ),
);

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const layout = (id: string, token: string | null) =>
  load({
    fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
    locals: { token },
    params: { id },
    // A stale token loads no settings, so the root layout has no viewer.
    parent: () => Promise.resolve({ user: null }),
    url: new URL(`https://og.test/users/${id}/watchlist`),
  } as unknown as Parameters<typeof load>[0]);

const redirectOf = (promise: Promise<unknown>) =>
  promise.then(
    () => null,
    (thrown: unknown) => (isRedirect(thrown) ? thrown.location : thrown),
  );

const statusOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 200,
    (thrown: unknown) => (isHttpError(thrown) ? thrown.status : thrown),
  );

describe('users/[id] layout', () => {
  describe('for a token that stopped working', () => {
    it("should render another member's profile logged-out", async () => {
      const data = await layout('justin', 'stale');

      expect(data.profile.slug).toBe('justin');
      expect(data.stats?.network).toMatchObject({ followers: 3, following: 4 });
      expect(data.signedIn).toBe(false);
      expect(seen.map((request) => request.headers.get('authorization'))).toEqual(['Bearer stale', null]);
    });

    it('should send /users/me to sign in', async () => {
      expect(await redirectOf(layout('me', 'stale'))).toBe('/signin?redirect_to=%2Fusers%2Fme%2Fwatchlist');
    });
  });

  describe('for a profile that is not there', () => {
    it('should answer a missing member with a 404', async () => {
      server.use(http.get(`${API}/users/:id`, () => new HttpResponse(null, { status: 404 })));

      expect(await statusOf(layout('nobody', null))).toBe(404);
    });

    it('should answer a deleted account with a 410', async () => {
      server.use(http.get(`${API}/users/:id`, () => HttpResponse.json({ ...PROFILE, deleted: true })));

      expect(await statusOf(layout('justin', null))).toBe(410);
    });
  });

  describe('for the taste match', () => {
    // A client navigation, so the viewer's network lists wait until something reads them.
    const signedIn = (id: string, viewer: string) =>
      load({
        fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
        locals: { token: 'fresh' },
        params: { id },
        parent: () => Promise.resolve({ user: { slug: viewer } }),
        url: new URL(`https://og.test/users/${id}`),
        isDataRequest: true,
      } as unknown as Parameters<typeof load>[0]);

    it("should stream the viewer's match on someone else's profile", async () => {
      server.use(
        http.get(`${API}/v3/users/:id/match`, () =>
          HttpResponse.json({
            score: 50,
            breakdown: { subgenres: 50, favorites: 0 },
            shared: { subgenres: [{ name: 'heist', slug: 'heist' }], favorites: { movies: [], shows: [] } },
          }),
        ),
      );

      const data = await signedIn('justin', 'sean');

      expect((await data.match)?.level.key).toBe('spin-off');
    });

    it('should have none on your own profile', async () => {
      expect((await signedIn('justin', 'justin')).match).toBeNull();
    });

    it('should have none signed out', async () => {
      expect((await layout('justin', null)).match).toBeNull();
    });
  });

  it('should read the profile once with a working token', async () => {
    const data = await layout('justin', 'fresh');

    expect(data.profile.slug).toBe('justin');
    expect(seen).toHaveLength(1);
  });
});
