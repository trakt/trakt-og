import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadPromotions } from './loadPromotions.ts';

const ORIGIN = 'https://og.test';
const entry = {
  id: 'spring-offer',
  name: 'Spring Offer',
  label: 'SO · 01',
  theme: 'tickets',
  starts_at: '2030-03-01T08:00:00.000Z',
  ends_at: '2030-03-06T08:00:00.000Z',
  plan: {
    duration: 'two_years',
    currency: 'usd',
    amount: 100,
    discounted_amount: 70,
    months_in_term: 24,
    first_term_only: true,
  },
};

let calls = 0;
const server = setupServer(
  http.get('https://apiz.trakt.tv/vip/promotions', () => {
    calls += 1;
    return HttpResponse.json([entry]);
  }),
);

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  calls = 0;
});
afterAll(() => server.close());

describe('loadPromotions', () => {
  it('should load the promotions without a cache', async () => {
    const promotions = await loadPromotions({ fetch: globalThis.fetch, cache: undefined, origin: ORIGIN });
    expect(promotions.map(({ id }) => id)).toEqual(['spring-offer']);
  });

  it('should keep them in the cache for the next request', async () => {
    const kept = new Map<string, string>();
    const cache = {
      match: (key: string) => Promise.resolve(kept.has(key) ? new Response(kept.get(key)) : undefined),
      put: async (key: string, response: Response) => void kept.set(key, await response.text()),
    };
    await loadPromotions({ fetch: globalThis.fetch, cache, origin: ORIGIN });
    await loadPromotions({ fetch: globalThis.fetch, cache, origin: ORIGIN });
    expect(calls).toBe(1);
    expect(kept.has(`${ORIGIN}/_cache/promotions`)).toBe(true);
  });

  it('should be none when the API fails', async () => {
    server.use(http.get('https://apiz.trakt.tv/vip/promotions', () => new HttpResponse('boom', { status: 500 })));
    expect(await loadPromotions({ fetch: globalThis.fetch, cache: undefined, origin: ORIGIN })).toEqual([]);
  });

  it('should be none when the request itself fails', async () => {
    server.use(http.get('https://apiz.trakt.tv/vip/promotions', () => HttpResponse.error()));
    expect(await loadPromotions({ fetch: globalThis.fetch, cache: undefined, origin: ORIGIN })).toEqual([]);
  });
});
