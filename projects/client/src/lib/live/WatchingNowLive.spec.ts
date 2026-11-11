import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { WatchingNowLive } from './WatchingNowLive.ts';

const trendingRow = (type: string, slug: string) => ({
  watchers: 10,
  [type === 'shows' ? 'show' : 'movie']: { title: `Trending ${slug}`, year: 2026, ids: { trakt: 1, slug } },
});

let reads = 0;
const server = setupServer(
  http.get('https://apiz.trakt.tv/:type/trending', ({ params }) => {
    reads += 1;
    return HttpResponse.json([trendingRow(String(params.type), 'one')], {
      headers: { 'X-Trending-User-Count': '1000', 'X-Pagination-Item-Count': '1' },
    });
  }),
  http.get('https://apiz.trakt.tv/:type/:slug/watching', ({ params }) => {
    reads += 1;
    return HttpResponse.json(
      Array.from({ length: 6 }, (_, i) => ({ username: `${params.type}-${i}`, private: false, location: 'Brazil' })),
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  reads = 0;
});
afterAll(() => server.close());

function worldWith(open: number) {
  const sent: string[] = [];
  const kept = new Map<string, unknown>([['config', { apiKey: 'key', environment: 'https://apiz.trakt.tv' }]]);
  const alarm = { at: null as number | null };
  const sockets = Array.from({ length: open }, () => ({ send: (message: string) => sent.push(message) }));
  const ctx = {
    acceptWebSocket: () => undefined,
    getWebSockets: () => sockets as unknown as WebSocket[],
    storage: {
      get: async <T>(key: string) => kept.get(key) as T | undefined,
      put: async (key: string, value: unknown) => void kept.set(key, value),
      getAlarm: async () => alarm.at,
      setAlarm: async (at: number) => void (alarm.at = at),
    },
  };
  return { world: new WatchingNowLive(ctx, {}), sent, alarm };
}

describe('WatchingNowLive', () => {
  it('should read the API and send each open socket the count, then step again in 10 seconds', async () => {
    const { world, sent, alarm } = worldWith(2);
    const before = Date.now();
    await world.alarm();

    expect(sent).toHaveLength(2);
    expect(JSON.parse(sent[0] ?? '')).toMatchObject({
      live: { shows: 1000, movies: 1000, countries: [{ code: 'BR', share: 1 }] },
    });
    expect(alarm.at).toBeGreaterThanOrEqual(before + 10_000);
  });

  it('should stop, reading nothing, when nobody has the page open', async () => {
    const { world, alarm } = worldWith(0);
    await world.alarm();

    expect(reads).toBe(0);
    expect(alarm.at).toBeNull();
  });

  it('should not send a count again when nothing changed', async () => {
    const { world, sent } = worldWith(1);
    await world.alarm();
    await world.alarm();

    expect(sent).toHaveLength(1);
  });
});
