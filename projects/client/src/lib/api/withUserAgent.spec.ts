import { describe, expect, it } from 'vitest';
import { fetchWithUserAgent, withUserAgent } from './withUserAgent.ts';

const URL = 'https://apiz.trakt.tv/calendars/all/shows/premieres/2026-10-24/7';

describe('withUserAgent', () => {
  it('should name og when the request has no User-Agent', () => {
    expect(withUserAgent(new Request(URL)).headers.get('user-agent')).toBe('og.trakt.tv');
  });

  it("should keep a request's own User-Agent", () => {
    const request = new Request(URL, { headers: { 'user-agent': 'og-test' } });
    expect(withUserAgent(request)).toBe(request);
  });

  it('should keep the rest of the request', () => {
    const request = new Request(URL, { method: 'POST', headers: { 'trakt-api-version': '2' }, body: '{}' });
    const named = withUserAgent(request);
    expect(named.method).toBe('POST');
    expect(named.url).toBe(URL);
    expect(named.headers.get('trakt-api-version')).toBe('2');
  });

  it('should name og on a wrapped fetch', async () => {
    const seen: Request[] = [];
    const base = (input: RequestInfo | URL) => {
      seen.push(input as Request);
      return Promise.resolve(new Response('{}'));
    };
    await fetchWithUserAgent(base as typeof fetch)(URL, { headers: { 'trakt-api-version': '2' } });
    expect(seen[0]?.headers.get('user-agent')).toBe('og.trakt.tv');
    expect(seen[0]?.headers.get('trakt-api-version')).toBe('2');
  });
});
