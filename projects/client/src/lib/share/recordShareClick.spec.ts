import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { recordShareClick } from './recordShareClick.ts';

const CLICK = 'https://apiz.trakt.tv/v3/shares/click';
const click = { code: 'Ab12Cd34Ef56', url: 'https://og.trakt.tv/movies/tron-1982?share=Ab12Cd34Ef56' };
const sent: unknown[] = [];
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
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
