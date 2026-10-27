import { describe, expect, it } from 'vitest';
import { withCrawlHeaders } from './withCrawlHeaders.ts';

const PERSON = { verified: false, bot: false };
const VERIFIED = { verified: true, bot: true };

const page = (headers?: HeadersInit) =>
  new Response('<html></html>', { headers: { 'content-type': 'text/html', ...headers } });

const apply = (response: Response, href = 'https://og.trakt.tv/movies/tron-1982', crawler = PERSON) =>
  withCrawlHeaders({ response, url: new URL(href), hasSession: false, crawler }).headers;

describe('util: withCrawlHeaders', () => {
  describe('on og.trakt.tv', () => {
    it('should set the cache headers on a page', () => {
      const headers = apply(page(), undefined, VERIFIED);
      expect(headers.get('cache-control')).toBe('private, max-age=3600');
      expect(headers.get('vary')).toBe('Cookie');
      expect(headers.get('x-robots-tag')).toBeNull();
    });

    it('should set them on a redirect', () => {
      const headers = apply(new Response(null, { status: 302, headers: { location: '/movies/trending' } }));
      expect(headers.get('cache-control')).toBe('no-store');
      expect(headers.get('vary')).toBe('Cookie');
    });

    it('should add Cookie to an existing Vary once', () => {
      expect(apply(page({ vary: 'Accept-Encoding' })).get('vary')).toBe('Accept-Encoding, Cookie');
      expect(apply(page({ vary: 'cookie' })).get('vary')).toBe('cookie');
    });

    it('should leave anything else as it is', () => {
      const response = Response.json({}, { headers: { 'cache-control': 'public, max-age=60' } });
      expect(
        withCrawlHeaders({ response, url: new URL('https://og.trakt.tv/api/x'), hasSession: true, crawler: PERSON }),
      ).toBe(response);
    });
  });

  describe('on any other host', () => {
    it('should ask search engines not to index anything', () => {
      const robots = new Response('Disallow: /', { headers: { 'content-type': 'text/plain' } });
      expect(apply(robots, 'https://preview.trakt-og.workers.dev/robots.txt').get('x-robots-tag')).toBe('noindex');
      expect(apply(page(), 'http://localhost:5173/').get('x-robots-tag')).toBe('noindex');
    });
  });

  it("should keep the response's status and body", async () => {
    const response = withCrawlHeaders({
      response: new Response('gone', { status: 404, headers: { 'content-type': 'text/html' } }),
      url: new URL('https://og.trakt.tv/movies/missing'),
      hasSession: false,
      crawler: PERSON,
    });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('gone');
  });
});
