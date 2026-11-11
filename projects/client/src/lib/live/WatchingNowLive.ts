import { traktApi } from '@trakt/api';
import { DurableObject } from 'cloudflare:workers';
import { cacheFreshFor } from '#lib/api/cacheFreshFor.ts';
import { fetchWithUserAgent } from '#lib/api/withUserAgent.ts';
import { sumTrendingWatchers } from '#lib/charts/sumTrendingWatchers.ts';
import { fetchHomeTrending } from '#lib/home/live/fetchHomeTrending.ts';
import { fetchTitleWatching } from '#lib/home/live/fetchTitleWatching.ts';
import { toHomeLive } from '#lib/home/live/toHomeLive.ts';
import { type LiveConfig, liveConfig } from './liveConfig.ts';
import { EMPTY_LIVE, type LiveReads, type LiveState, stepLive } from './stepLive.ts';

/** How often the refresher steps while anyone is watching. */
const TICK_MS = 10_000;
/**
 * How often it saves what it holds in memory. Cloudflare can evict it between saves; it then starts from the last one
 * and reads a few titles again, a small price next to a write every step.
 */
const SAVE_MS = 60_000;

/** What the refresher saves: its state and the last count it sent, for a socket that opens after an eviction. */
type Saved = { readonly state: LiveState; readonly sent: string | null };

/** A fetch that notes the soonest any of its responses' cached copies at the API runs out. */
function noting() {
  const base = fetchWithUserAgent();
  let soonest: number | null = null;
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const response = await base(input, init);
    const fresh = cacheFreshFor(response.headers);
    if (fresh !== null) soonest = Math.min(soonest ?? fresh, fresh);
    return response;
  };
  return { fetch, soonest: () => soonest };
}

function readsOf({ apiKey, environment }: LiveConfig): LiveReads {
  const clientOf = (fetch: typeof globalThis.fetch) => traktApi({ apiKey, environment, fetch });
  const watchingClient = clientOf(fetchWithUserAgent());
  return {
    trending: async () => {
      const seen = noting();
      const value = await fetchHomeTrending(clientOf(seen.fetch));
      return { value, freshForMs: seen.soonest() };
    },
    total: async () => {
      const seen = noting();
      const client = clientOf(seen.fetch);
      const [shows, movies] = await Promise.all([
        sumTrendingWatchers({ client, type: 'shows' }),
        sumTrendingWatchers({ client, type: 'movies' }),
      ]);
      return shows !== null && movies !== null ? { value: { shows, movies }, freshForMs: seen.soonest() } : null;
    },
    watching: (title) => fetchTitleWatching(watchingClient, title),
  };
}

/**
 * The live page's one refresher for the whole world, a Durable Object. og's worker passes it each VIP's socket. While
 * any socket is open, an alarm steps it every 10 seconds (`stepLive`), and each open socket gets the new count when
 * it changes. With no sockets left the alarm stops, and so do its reads. Sockets hibernate between steps, so an idle
 * moment costs nothing, and what it keeps lives in its storage to survive that.
 */
export class WatchingNowLive extends DurableObject {
  #state: LiveState | null = null;
  #sent: string | null = null;
  #savedAt = 0;

  async fetch(request: Request): Promise<Response> {
    const config = liveConfig.read(request.headers);
    if (request.headers.get('upgrade') !== 'websocket' || !config) return new Response(null, { status: 400 });

    const known = await this.ctx.storage.get<LiveConfig>('config');
    if (known?.apiKey !== config.apiKey || known.environment !== config.environment) {
      await this.ctx.storage.put('config', config);
    }
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    const sent = this.#sent ?? (await this.ctx.storage.get<Saved>('saved'))?.sent ?? null;
    if (sent) pair[1].send(sent);
    if ((await this.ctx.storage.getAlarm()) === null) {
      await this.ctx.storage.setAlarm(Date.now() + (sent ? TICK_MS : 0));
    }
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async alarm(): Promise<void> {
    if (this.ctx.getWebSockets().length === 0) return;
    // A step that throws still books the next one, so open sockets never go quiet.
    try {
      await this.#step();
    } finally {
      await this.ctx.storage.setAlarm(Date.now() + TICK_MS);
    }
  }

  webSocketMessage(): void {}

  webSocketClose(socket: WebSocket): void {
    socket.close();
  }

  webSocketError(socket: WebSocket): void {
    socket.close();
  }

  async #step(): Promise<void> {
    const config = await this.ctx.storage.get<LiveConfig>('config');
    if (!config) return;

    const state = this.#state ?? (await this.ctx.storage.get<Saved>('saved'))?.state ?? EMPTY_LIVE;
    const next = await stepLive({ state, reads: readsOf(config), now: Date.now(), random: Math.random });
    // Nothing came due this step: no write, no new count to build.
    if (next === state) return;
    this.#state = next;

    const sources = Object.values(next.watching).map(({ source }) => source);
    if (!next.total || sources.length === 0) return;
    const message = JSON.stringify({ live: toHomeLive(next.total.value, sources) });
    if (message !== this.#sent) {
      this.#sent = message;
      this.ctx.getWebSockets().forEach((socket) => socket.send(message));
    }
    await this.#save(next);
  }

  /** Saves the state and the last count at most once a minute, both in one write. */
  async #save(state: LiveState): Promise<void> {
    const now = Date.now();
    if (now - this.#savedAt < SAVE_MS) return;
    this.#savedAt = now;
    const saved: Saved = { state, sent: this.#sent };
    // About 150 KB on a quiet evening against a 2 MB limit per value. A save that fails (a huge night) only costs the
    // next eviction a few reads, so it never stops the updates.
    await this.ctx.storage.put('saved', saved).catch((error: unknown) => console.error('Live save failed', error));
  }
}
