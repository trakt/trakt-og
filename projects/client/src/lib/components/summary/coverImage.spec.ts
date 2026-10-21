import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { isCoverOf, setCoverImage } from './coverImage.ts';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const cover = 'https://walter-r2.trakt.tv/images/shows/000/170/297/fanarts/medium/2e1a4bd9a7.jpg.webp';

describe('isCoverOf', () => {
  it('should match the item a cover URL belongs to', () => {
    expect(isCoverOf(cover, { type: 'show', id: 170297 })).toBe(true);
  });

  it('should not match another item or another type with the same id', () => {
    expect(isCoverOf(cover, { type: 'show', id: 1 })).toBe(false);
    expect(isCoverOf(cover, { type: 'movie', id: 170297 })).toBe(false);
  });

  it('should not match without a cover', () => {
    expect(isCoverOf(null, { type: 'show', id: 170297 })).toBe(false);
    expect(isCoverOf('https://example.com/cover.jpg', { type: 'show', id: 170297 })).toBe(false);
  });
});

describe('setCoverImage', () => {
  it('should send the item as the cover', async () => {
    let body: unknown;
    server.use(http.put('https://apiz.trakt.tv/users/set_cover', async ({ request }) => {
      body = await request.json();
      return new HttpResponse(null, { status: 204 });
    }));
    const result = await setCoverImage({ fetch, type: 'show', id: 170297 });
    expect(body).toEqual({ cover_type: 'show', cover_id: 170297 });
    expect(result.ok).toBe(true);
  });

  it('should explain a VIP-only refusal', async () => {
    server.use(http.put('https://apiz.trakt.tv/users/set_cover', () => new HttpResponse(null, { status: 403 })));
    expect(await setCoverImage({ fetch, type: 'movie', id: 1 })).toEqual({
      ok: false,
      message: 'This action requires VIP membership.',
    });
  });

  it('should fail softly on any other error', async () => {
    server.use(http.put('https://apiz.trakt.tv/users/set_cover', () => new HttpResponse(null, { status: 500 })));
    expect((await setCoverImage({ fetch, type: 'movie', id: 1 })).ok).toBe(false);
  });
});
