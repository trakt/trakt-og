import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchPrivateNote } from './fetchPrivateNote.ts';

const seen: Request[] = [];
const server = setupServer(
  http.get('https://apiz.trakt.tv/v3/users/me/notes/:type/:slug', ({ request }) => {
    seen.push(request);
    return HttpResponse.json([
      { id: 8, notes: 'Rewatch it', created_at: null, updated_at: '2026-09-29T12:00:00.000Z', type: 'note' },
    ]);
  }),
);
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

describe('fetchPrivateNote', () => {
  it("should read the note with the fetch it is given, and no token of its own, as the browser's does", async () => {
    const signedIn: typeof fetch = (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set('Authorization', 'Bearer viewer');
      return fetch(input, { ...init, headers });
    };

    const note = await fetchPrivateNote({ fetch: signedIn, token: null, item: { type: 'movie', id: 1, slug: 'x' } });

    expect(note).toMatchObject({ id: 8, text: 'Rewatch it' });
    expect(seen.at(0)?.headers.get('authorization')).toBe('Bearer viewer');
  });

  it('should come back null when the read fails', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/v3/users/me/notes/:type/:slug', () => new HttpResponse(null, { status: 401 })),
    );

    expect(await fetchPrivateNote({ fetch, token: null, item: { type: 'show', id: 2, slug: 'y' } })).toBeNull();
  });
});
