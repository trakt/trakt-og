import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { recordShareArrival, recordShareClick } from './recordShareClick.ts';

const CLICK = 'https://apiz.trakt.tv/v3/shares/click';
const click = { code: 'Ab12Cd34Ef56', url: 'https://og.trakt.tv/movies/tron-1982?share=Ab12Cd34Ef56' };
const sent: unknown[] = [];
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  sent.length = 0;
});
afterAll(() => server.close());

const answer = (response: () => Response) =>
  server.use(
    http.post(CLICK, async ({ request }) => {
      sent.push(await request.json());
      return response();
    }),
  );

describe('request: recordShareClick', () => {
  it('should send the code and the page it opened', async () => {
    answer(() => HttpResponse.json({ outcome: 'recorded', recommended_by: { users: [], other_count: 0 } }));
    expect(await recordShareClick({ fetch, click })).toBe('recorded');
    expect(sent).toEqual([click]);
  });

  it('should pass on a duplicate or rejected click', async () => {
    answer(() => HttpResponse.json({ outcome: 'duplicate' }));
    expect(await recordShareClick({ fetch, click })).toBe('duplicate');
    answer(() => HttpResponse.json({ outcome: 'rejected' }));
    expect(await recordShareClick({ fetch, click })).toBe('rejected');
  });

  describe('when the request fails', () => {
    it('should return null for an error status', async () => {
      answer(() => new HttpResponse(null, { status: 401 }));
      expect(await recordShareClick({ fetch, click })).toBeNull();
    });

    it('should return null for a body it does not know', async () => {
      answer(() => HttpResponse.json({ outcome: 'credited' }));
      expect(await recordShareClick({ fetch, click })).toBeNull();
    });

    it('should return null when the network fails', async () => {
      server.use(http.post(CLICK, () => HttpResponse.error()));
      expect(await recordShareClick({ fetch, click })).toBeNull();
    });
  });
});

describe('request: recordShareArrival', () => {
  const url = new URL(click.url);

  it('should pass on the recorded outcome for a signed-in visitor', async () => {
    answer(() => HttpResponse.json({ outcome: 'duplicate' }));
    expect(await recordShareArrival({ fetch, url })).toBe('duplicate');
    expect(sent).toEqual([click]);
  });

  it('should not credit a malformed code', async () => {
    const malformed = new URL('https://og.trakt.tv/movies/tron-1982?share=nope');
    const empty = new URL('https://og.trakt.tv/movies/tron-1982?share=');
    expect(await recordShareArrival({ fetch, url: malformed })).toBe('uncredited');
    expect(await recordShareArrival({ fetch, url: empty })).toBe('uncredited');
    expect(sent).toEqual([]);
  });

  it('should not record a signed-out visit', async () => {
    expect(await recordShareArrival({ fetch: null, url })).toBe('anonymous');
    expect(sent).toEqual([]);
  });

  it('should report a failed request', async () => {
    answer(() => new HttpResponse(null, { status: 500 }));
    expect(await recordShareArrival({ fetch, url })).toBe('failed');
  });
});
