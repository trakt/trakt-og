import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchParentalGuide } from './fetchParentalGuide.ts';

const API = 'https://apiz.trakt.tv';
const GUIDE = `${API}/v3/media/show/phony/info/16/version/1`;
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const read = (token: string | null) =>
  fetchParentalGuide({ fetch: (...args) => fetch(...args), token, type: 'show', id: 'phony' });
const signals = { none: 1, mild: 2, moderate: 3, severe: 4 };

describe('fetchParentalGuide', () => {
  it("should map the guide in the filter's order, sent with the viewer's token", async () => {
    let bearer: string | null = null;
    server.use(
      http.get(GUIDE, ({ request }) => {
        bearer = request.headers.get('authorization');
        return HttpResponse.json({
          guide: [
            { category: 'FRIGHTENING', severity: 'NONE', signals },
            { category: 'VIOLENCE', severity: 'MODERATE', signals },
            { category: 'NUDITY', severity: 'MILD', signals },
            { category: 'SPOILERS', severity: 'SEVERE', signals },
          ],
        });
      }),
    );
    expect(await read('token')).toEqual([
      { category: 'nudity', level: 1 },
      { category: 'violence', level: 2 },
      { category: 'frightening', level: 0 },
    ]);
    expect(bearer).toBe('Bearer token');
  });

  it('should have no guide for a guest, without asking', async () => {
    let asked = false;
    server.use(
      http.get(GUIDE, () => {
        asked = true;
        return HttpResponse.json({ guide: [] });
      }),
    );
    expect(await read(null)).toEqual([]);
    expect(asked).toBe(false);
  });

  it('should have no guide when the API has none or answers with something else', async () => {
    server.use(http.get(GUIDE, () => new HttpResponse(null, { status: 404 })));
    expect(await read('token')).toEqual([]);
    server.use(http.get(GUIDE, () => HttpResponse.json({ guide: 'nope' })));
    expect(await read('token')).toEqual([]);
  });
});
