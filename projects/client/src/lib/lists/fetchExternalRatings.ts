import { ratingsResponseSchema } from '@trakt/api';
import { api } from '../api/api.ts';
import { contractSchema } from '../api/contractSchema.ts';
import type { toExternalRatings } from '../components/summary/toExternalRatings.ts';
import type { SeasonOf } from '../overlay/createOverlay.svelte.ts';

type Ratings = NonNullable<Parameters<typeof toExternalRatings>[0]['ratings']>;

/** A poster with other sites' ratings: movies, shows, and episodes with their show, season and number. */
export type ExternalRatingsTarget =
  | { readonly type: 'movie' | 'show'; readonly id: number }
  | { readonly type: 'episode'; readonly id: number; readonly seasonOf?: SeasonOf };

type ReaderOptions = {
  fetch?: typeof globalThis.fetch;
  now?: () => number;
  /** Reads sent at once: a screenful of posters queues instead of bursting. */
  concurrency?: number;
  /**
   * Reads allowed per window. The API only says how close the viewer is to its limit once it refuses them, so the
   * posters keep well under it on their own and stop there, leaving the rest of og its share.
   */
  budget?: number;
  windowMs?: number;
  /** How long a 429 without a usable `Retry-After` stops the reads. */
  pauseMs?: number;
};

const SKIPPED = new Error('Skipped: over budget or paused');

function read(fetch: typeof globalThis.fetch, target: ExternalRatingsTarget) {
  const client = api({ fetch });
  const query = { extended: 'all' } as const;
  if (target.type !== 'episode') {
    const id = String(target.id);
    return target.type === 'movie'
      ? client.movies.ratings({ params: { id }, query })
      : client.shows.ratings({ params: { id }, query });
  }
  const { show, number: season, episode } = target.seasonOf ?? {};
  if (show === undefined || season === undefined || episode === undefined) return null;
  return client.shows.episode.ratings({ params: { id: String(show), season, episode }, query });
}

/**
 * Reads items' ratings on other sites without the token, so the worker's cache answers, once per item. Null when an
 * item has none, the read fails, the budget is spent, or a 429 has paused the reads; anything but a real answer is
 * forgotten, so a later visit tries again.
 */
export function createExternalRatingsReader({
  fetch = globalThis.fetch,
  now = Date.now,
  concurrency = 4,
  budget = 250,
  windowMs = 5 * 60_000,
  pauseMs = 5 * 60_000,
}: ReaderOptions = {}) {
  const cache = new Map<string, Promise<Ratings | null>>();
  const sent: number[] = [];
  const waiting: (() => void)[] = [];
  let inFlight = 0;
  let pausedUntil = 0;

  function mayRead() {
    const at = now();
    while (sent.length > 0 && (sent[0] ?? 0) <= at - windowMs) sent.shift();
    return at >= pausedUntil && sent.length < budget;
  }

  async function queued(target: ExternalRatingsTarget): Promise<Ratings | null> {
    if (inFlight >= concurrency) await new Promise<void>((resolve) => waiting.push(resolve));
    inFlight += 1;
    try {
      if (!mayRead()) throw SKIPPED;
      sent.push(now());
      const response = await read(fetch, target);
      if (!response) return null;
      if (response.status === 429) {
        const seconds = Number(response.headers.get('retry-after'));
        pausedUntil = now() + (Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : pauseMs);
      }
      if (response.status !== 200) throw new Error(`Ratings answered ${response.status}`);
      return contractSchema(ratingsResponseSchema).safeParse(response.body).data ?? null;
    } finally {
      inFlight -= 1;
      waiting.shift()?.();
    }
  }

  return (target: ExternalRatingsTarget): Promise<Ratings | null> => {
    const key = `${target.type}:${target.id}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const ratings = queued(target).catch(() => {
      cache.delete(key);
      return null;
    });
    cache.set(key, ratings);
    return ratings;
  };
}

export const fetchExternalRatings = createExternalRatingsReader();
