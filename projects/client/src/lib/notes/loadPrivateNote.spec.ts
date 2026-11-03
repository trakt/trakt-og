import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadPrivateNote } from './loadPrivateNote.ts';

const seen: Request[] = [];
const server = setupServer(
  http.get('https://apiz.trakt.tv/v3/users/me/notes/:type/:slug', ({ request }) => {
    seen.push(request);
    return HttpResponse.json([
      { id: 7, notes: 'Favorite pick', created_at: null, updated_at: null, type: 'favorites' },
      { id: 8, notes: 'Rewatch it', created_at: null, updated_at: '2026-09-29T12:00:00.000Z', type: 'note' },
    ]);
  }),
  http.get('https://apiz.trakt.tv/users/me/notes/people', ({ request }) => {
    seen.push(request);
    return HttpResponse.json([
      {
        type: 'person',
        person: { name: 'Someone', ids: { trakt: 2, slug: 'someone' } },
        attached_to: { type: 'person' },
        note: { id: 9, notes: 'Great in everything', privacy: 'private', updated_at: '2026-09-28T10:00:00.000Z' },
      },
    ]);
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

describe('loadPrivateNote', () => {
  it('should skip the API when logged out', async () => {
    expect(
      await loadPrivateNote({ fetch, token: null, item: { type: 'movie', id: 1, slug: 'fight-club-1999' } }),
    ).toBeNull();
    expect(seen).toHaveLength(0);
  });

  it('should read the v3 note with the token and ignore the favorites note', async () => {
    const note = await loadPrivateNote({
      fetch,
      token: 'viewer',
      item: { type: 'show', id: 1, slug: 'the-boys-2019' },
    });
    expect(new URL(seen.at(0)?.url ?? '').pathname).toBe('/v3/users/me/notes/show/the-boys-2019');
    expect(seen.at(0)?.headers.get('authorization')).toBe('Bearer viewer');
    expect(note).toEqual({ id: 8, text: 'Rewatch it', createdAt: null, updatedAt: '2026-09-29T12:00:00.000Z' });
  });

  it('should find a person note in the listing', async () => {
    const note = await loadPrivateNote({ fetch, token: 'viewer', item: { type: 'person', id: 2, slug: 'someone' } });
    expect(seen.at(0)?.url).toContain('/users/me/notes/people?limit=all');
    expect(note).toEqual({
      id: 9,
      text: 'Great in everything',
      createdAt: null,
      updatedAt: '2026-09-28T10:00:00.000Z',
    });
  });

  it('should return null for a person without a note', async () => {
    expect(
      await loadPrivateNote({ fetch, token: 'viewer', item: { type: 'person', id: 3, slug: 'nobody' } }),
    ).toBeNull();
  });

  it('should read v2’s listing when the client ID may not call v3, skipping notes on plays', async () => {
    server.use(
      http.get(
        'https://apiz.trakt.tv/v3/users/me/notes/:type/:slug',
        () => new HttpResponse('Forbidden', { status: 403 }),
      ),
      http.get('https://apiz.trakt.tv/users/me/notes/movies', ({ request }) => {
        seen.push(request);
        const row = (type: string, id: number, notes: string) => ({
          type: 'movie',
          movie: { ids: { trakt: 1, slug: 'x' } },
          attached_to: { type },
          note: { id, notes, privacy: 'private', updated_at: '2026-09-27T10:00:00.000Z' },
        });
        return HttpResponse.json([row('history', 10, 'On a play'), row('movie', 11, 'On the movie')]);
      }),
    );
    const note = await loadPrivateNote({ fetch, token: 'viewer', item: { type: 'movie', id: 1, slug: 'x' } });
    expect(seen.at(0)?.url).toContain('/users/me/notes/movies?limit=all');
    expect(note).toEqual({ id: 11, text: 'On the movie', createdAt: null, updatedAt: '2026-09-27T10:00:00.000Z' });
  });

  it('should read an episode or season note from its listing, without v3', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/users/me/notes/:type', ({ request, params }) => {
        seen.push(request);
        const type = params.type === 'episodes' ? 'episode' : 'season';
        return HttpResponse.json([
          {
            type,
            [type]: { ids: { trakt: 73482 } },
            attached_to: { type },
            note: {
              id: 12,
              notes: `On the ${type}`,
              privacy: 'private',
              created_at: '2026-09-20T10:00:00.000Z',
              updated_at: '2026-09-26T10:00:00.000Z',
            },
          },
        ]);
      }),
    );
    for (const type of ['episode', 'season'] as const) {
      seen.length = 0;
      const note = await loadPrivateNote({ fetch, token: 'viewer', item: { type, id: 73482 } });
      expect(seen.map(({ url }) => new URL(url).pathname)).toEqual([`/users/me/notes/${type}s`]);
      expect(note).toEqual({
        id: 12,
        text: `On the ${type}`,
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: '2026-09-26T10:00:00.000Z',
      });
    }
  });

  it('should return null when the read fails', async () => {
    server.use(
      http.get('https://apiz.trakt.tv/v3/users/me/notes/:type/:slug', () => new HttpResponse(null, { status: 401 })),
    );
    expect(await loadPrivateNote({ fetch, token: 'stale', item: { type: 'movie', id: 1, slug: 'x' } })).toBeNull();
  });
});
