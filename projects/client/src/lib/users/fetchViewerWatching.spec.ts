import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { api } from '../api/api.ts';
import { fetchViewerWatching } from './fetchViewerWatching.ts';

const API = 'https://apiz.trakt.tv';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Through a wrapper, so the mock server's patched fetch answers.
const client = api({
  fetch: (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args),
  token: 'token',
});

describe('fetchViewerWatching', () => {
  it('should map what the viewer is playing', async () => {
    server.use(
      http.get(`${API}/users/me/watching`, () =>
        HttpResponse.json({
          expires_at: '2026-11-10T21:00:00Z',
          started_at: '2026-11-10T20:10:00Z',
          action: 'checkin',
          type: 'movie',
          movie: { title: 'Fight Club', runtime: 139, ids: { slug: 'fight-club-1999', trakt: 432 } },
        }),
      ),
    );

    expect(await fetchViewerWatching({ client })).toMatchObject({
      action: 'checkin',
      title: 'Fight Club',
      href: '/movies/fight-club-1999',
      runtime: 139,
    });
  });

  it('should answer null when nothing is playing', async () => {
    server.use(http.get(`${API}/users/me/watching`, () => new HttpResponse(null, { status: 204 })));

    expect(await fetchViewerWatching({ client })).toBeNull();
  });

  it('should throw on anything else, so the caller keeps what it had', async () => {
    server.use(http.get(`${API}/users/me/watching`, () => new HttpResponse(null, { status: 502 })));

    await expect(fetchViewerWatching({ client })).rejects.toThrow();
  });
});
