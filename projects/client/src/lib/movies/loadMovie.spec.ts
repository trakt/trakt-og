import { isHttpError } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadMovie } from './loadMovie.ts';

const server = setupServer(http.get('*', () => new HttpResponse(null, { status: 404 })));
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const statusOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 200,
    (thrown: unknown) => (isHttpError(thrown) ? thrown.status : thrown),
  );

const load = () =>
  loadMovie({
    fetch: globalThis.fetch,
    token: null,
    parent: () =>
      Promise.resolve({
        settings: null,
        user: null,
        datePreferences: { order: 'ymd', hour24: false, timeZone: 'UTC', weekStartDay: 0 },
      }),
    id: 'no-such-movie',
  });

describe('loadMovie', () => {
  it('should answer a missing movie with a 404', async () => {
    expect(await statusOf(load())).toBe(404);
  });

  it('should answer an API in maintenance with a 503', async () => {
    server.use(http.get('https://apiz.trakt.tv/movies/:id', () => new HttpResponse(null, { status: 503 })));

    expect(await statusOf(load())).toBe(503);
  });
});
