import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { api } from '../api/api.ts';
import { fetchRecapRibbon } from './fetchRecapRibbon.ts';

const now = new Date('2026-03-12T15:00:00Z');
const seen: URL[] = [];
const counts: Record<string, number> = { '01': 1900, '02': 1400, '03': 312 };

const history = (failMonth?: string) =>
  http.get(/\/users\/me\/history\/?(\?|$)/, ({ request }) => {
    const url = new URL(request.url);
    seen.push(url);
    const month = url.searchParams.get('start_at')?.slice(5, 7) ?? '';
    if (month === failMonth) return new HttpResponse(null, { status: 500 });
    return HttpResponse.json([], { headers: { 'X-Pagination-Item-Count': String(counts[month] ?? 0) } });
  });

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const load = () =>
  fetchRecapRibbon({
    client: api({ fetch: (...args) => globalThis.fetch(...args), token: 'abc' }),
    slug: 'sean',
    timeZone: 'UTC',
    now,
  });

describe('fetchRecapRibbon', () => {
  it('should count each month of the year so far from a one-row history page', async () => {
    server.use(history());

    const ribbon = await load();

    expect(seen.map((url) => [url.searchParams.get('start_at'), url.searchParams.get('end_at')])).toEqual([
      ['2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'],
      ['2026-02-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z'],
      ['2026-03-01T00:00:00.000Z', '2026-03-12T15:00:00.000Z'],
    ]);
    expect(seen.every((url) => url.searchParams.get('limit') === '1')).toBe(true);
    expect(ribbon.plays).toBe(3612);
    expect(ribbon.months.slice(0, 3).map(({ plays }) => plays)).toEqual([1900, 1400, 312]);
  });

  it('should fail when any month fails, rather than show a gap', async () => {
    server.use(history('02'));

    await expect(load()).rejects.toThrow('A month of history did not load');
  });
});
