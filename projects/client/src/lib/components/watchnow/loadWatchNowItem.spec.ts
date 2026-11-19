import { describe, expect, it } from 'vitest';
import { GENERIC_ERROR } from '../../utils/genericError.ts';
import { loadWatchNowItem } from './loadWatchNowItem.ts';

const empty = { free: [], subscription: [], cable: [], purchase: [], cinema: [] };

type Offers = { body: string; status: number };

const respond = (offers: Offers) =>
  ((url: string) => {
    const { pathname } = new URL(url);
    if (pathname === '/movies/x/watchnow') return Promise.resolve(new Response(offers.body, { status: offers.status }));
    if (pathname === '/watchnow/countries')
      return Promise.resolve(Response.json([{ code: 'us', name: 'United States' }]));
    return Promise.resolve(Response.json({ us: 'https://www.justwatch.com/us/movie/x' }));
  }) as typeof globalThis.fetch;

const load = (offers: Offers) =>
  loadWatchNowItem({ fetch: respond(offers), path: '/movies/x', justwatchPath: '/movies/x' });

describe('loadWatchNowItem', () => {
  it('should return the offers, countries and JustWatch links', async () => {
    expect(await load({ body: JSON.stringify({ us: empty }), status: 200 })).toMatchObject({
      failed: false,
      offers: { us: empty },
      unavailable: false,
      countries: [{ code: 'us', name: 'United States' }],
      justwatch: { us: 'https://www.justwatch.com/us/movie/x' },
    });
  });

  it('should say the API is rate limiting for a 429', async () => {
    expect(await load({ body: '', status: 429 })).toEqual({
      failed: true,
      message: "Doh! Trakt's API is rate limiting your requests. Try again in a few minutes.",
    });
  });

  it('should fail with the generic error when the offers read errors', async () => {
    expect(await load({ body: '', status: 500 })).toEqual({ failed: true, message: GENERIC_ERROR });
  });

  describe('when the request gets no readable answer', () => {
    const blocked = (() => Promise.reject(new TypeError('Load failed'))) as typeof globalThis.fetch;
    const unanswered = (online: boolean) =>
      loadWatchNowItem({ fetch: blocked, path: '/movies/x', justwatchPath: '/movies/x', online });

    it('should take it for a Cloudflare rate limit while online', async () => {
      expect(await unanswered(true)).toEqual({
        failed: true,
        message: "Doh! Trakt's API is rate limiting your requests. Try again in a few minutes.",
      });
    });

    it('should fail with the generic error while offline', async () => {
      expect(await unanswered(false)).toEqual({ failed: true, message: GENERIC_ERROR });
    });
  });

  it('should not fail when the client ID may not call watch-now routes', async () => {
    expect(await load({ body: 'Forbidden', status: 403 })).toMatchObject({ failed: false, unavailable: true });
  });
});
