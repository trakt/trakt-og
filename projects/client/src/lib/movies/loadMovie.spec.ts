import { isHttpError } from '@sveltejs/kit';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadMovie } from './loadMovie.ts';

const server = setupServer(http.get('*', () => new HttpResponse(null, { status: 404 })));
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const statusOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 200,
    (thrown: unknown) => (isHttpError(thrown) ? thrown.status : thrown),
  );

type Layout = Awaited<ReturnType<Parameters<typeof loadMovie>[0]['parent']>>;

const load = (viewer: { token: string; slug: string } | null = null) =>
  loadMovie({
    fetch: globalThis.fetch,
    token: viewer?.token ?? null,
    parent: () =>
      Promise.resolve({
        settings: null,
        user: viewer && ({ slug: viewer.slug } as Layout['user']),
        datePreferences: { order: 'ymd', hour24: false, timeZone: 'UTC', weekStartDay: 0 },
      }),
    id: viewer ? 'fight-club-1999' : 'no-such-movie',
  });

describe('loadMovie', () => {
  it('should answer a missing movie with a 404', async () => {
    expect(await statusOf(load())).toBe(404);
  });

  it('should answer an API in maintenance with a 503', async () => {
    server.use(http.get('https://apiz.trakt.tv/movies/:id', () => new HttpResponse(null, { status: 503 })));

    expect(await statusOf(load())).toBe(503);
  });

  it("should leave the viewer's private note to the browser", async () => {
    const paths: string[] = [];
    const record = ({ request }: { request: Request }) => paths.push(new URL(request.url).pathname);
    server.events.on('request:start', record);
    server.use(
      http.get('https://apiz.trakt.tv/movies/:id', () =>
        HttpResponse.json({ title: 'Fight Club', year: 1999, ids: { trakt: 268, slug: 'fight-club-1999' } }),
      ),
    );
    const data = await load({ token: 'abc', slug: 'kim' });
    server.events.removeListener('request:start', record);

    expect(paths.filter((path) => path.includes('notes'))).toEqual([]);
    expect(data.privateNotes).not.toHaveProperty('note');
    expect(data.privateNotes.signedIn).toBe(true);
  });
});
