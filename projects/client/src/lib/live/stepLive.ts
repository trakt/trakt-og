import type { LiveNow } from '#lib/charts/fetchLiveNow.ts';
import type { HomeTrending } from '#lib/home/live/fetchHomeTrending.ts';
import type { TitleWatching } from '#lib/home/live/fetchTitleWatching.ts';
import type { HomeWatchingSource } from '#lib/home/live/toHomeLive.ts';
import type { HomeTrendingTitle } from '#lib/home/live/toHomeTrending.ts';

/** A read's value and when to read it again. */
type Kept<T> = { readonly due: number; readonly value: T };

/** A read's value, and how long the API will keep answering with the same copy (`cacheFreshFor`). */
export type Fresh<T> = { readonly value: T; readonly freshForMs: number | null };

/** What the live refresher keeps between steps. */
export type LiveState = {
  readonly trending: Kept<HomeTrending> | null;
  readonly total: Kept<LiveNow> | null;
  /** Each trending title's watchers, by `type/slug`, and when to read them again. */
  readonly watching: Readonly<Record<string, { readonly due: number; readonly source: HomeWatchingSource }>>;
  /** Titles whose first read failed, by `type/slug`, and when to try again. */
  readonly failed?: Readonly<Record<string, number>>;
};

/** The API reads one step can make. */
export type LiveReads = {
  readonly trending: () => Promise<Fresh<HomeTrending>>;
  readonly total: () => Promise<Fresh<LiveNow> | null>;
  readonly watching: (title: HomeTrendingTitle) => Promise<TitleWatching | null>;
};

export const EMPTY_LIVE: LiveState = { trending: null, total: null, watching: {} };

const MINUTE_MS = 60_000;
/** Without a cache time from the API, how often to read trending and the total again. */
const TRENDING_MS = 15 * MINUTE_MS;
const TOTAL_MS = 5 * MINUTE_MS;
/** The API keeps trending and the total for an hour at most, so neither waits longer than that. */
const LONGEST_MS = 60 * MINUTE_MS;
/** After a failed read, wait this long before asking again. */
const RETRY_MS = MINUTE_MS;
/** The API keeps each title's watchers for 3 minutes. */
const WATCHING_MS = 3 * MINUTE_MS;
/** Each title's next read lands up to 15% either side of 3 minutes, so the titles stay spread across the window. */
const JITTER = 0.3;
/** The most titles one step reads again, so each step brings a little change and none brings a burst. */
const BATCH = 12;
/** The most titles read for the first time in one step: a cold start fills in over a few steps, not one burst. */
const FIRST_BATCH = 30;
/** Read a title this long after the API's copy of it runs out, so the next read gets the new one. */
const AFTER_EXPIRY_MS = 2000;
/** The soonest a title is read again, whatever the API says. */
const SOONEST_MS = 10_000;

interface StepLiveParams {
  state: LiveState;
  reads: LiveReads;
  now: number;
  random: () => number;
}

const keyOf = ({ type, slug }: HomeTrendingTitle) => `${type}/${slug}`;

/** How long after a read to read again: just after the API's copy runs out, within bounds, or `fallbackMs`. */
const afterExpiry = (freshForMs: number | null, longestMs: number, fallbackMs: number) =>
  freshForMs === null ? fallbackMs : Math.min(Math.max(freshForMs + AFTER_EXPIRY_MS, SOONEST_MS), longestMs);

async function keep<T>(kept: Kept<T> | null, fallbackMs: number, now: number, read: () => Promise<Fresh<T> | null>) {
  if (kept && now < kept.due) return kept;
  const fresh = await read().catch(() => null);
  if (!fresh) return kept && { ...kept, due: now + RETRY_MS };
  return { due: now + afterExpiry(fresh.freshForMs, LONGEST_MS, fallbackMs), value: fresh.value };
}

/**
 * One step of the live refresher: trending, the total and every title whose copy at the API has run out
 * (`cacheFreshFor`), titles not read yet first (at most 30), then the oldest (at most 12). Titles that left trending drop out. A read
 * that fails keeps what was there and waits a minute. With nothing due it returns the same state.
 */
export async function stepLive({ state, reads, now, random }: StepLiveParams): Promise<LiveState> {
  const [trending, total] = await Promise.all([
    keep(state.trending, TRENDING_MS, now, reads.trending),
    keep(state.total, TOTAL_MS, now, reads.total),
  ]);
  const titles = trending ? [...trending.value.shows, ...trending.value.movies] : [];
  const kept = new Map(
    titles.flatMap((title) => {
      const entry = state.watching[keyOf(title)];
      return entry ? [[keyOf(title), entry] as const] : [];
    }),
  );
  const unread = titles
    .filter((title) => !kept.has(keyOf(title)) && (state.failed?.[keyOf(title)] ?? 0) <= now)
    .slice(0, FIRST_BATCH);
  const due = titles
    .filter((title) => (kept.get(keyOf(title))?.due ?? Infinity) <= now)
    .toSorted((a, b) => (kept.get(keyOf(a))?.due ?? 0) - (kept.get(keyOf(b))?.due ?? 0))
    .slice(0, BATCH);
  const read = await Promise.all(
    [...unread, ...due].map(async (title) => [keyOf(title), await reads.watching(title)] as const),
  );
  // Each title comes due just after the API's copy of it runs out, when a read can bring something new. Without a
  // cache time, a title read for the first time comes due anywhere in the next 3 minutes and one read before about 3
  // minutes on, so the titles stay spread out.
  const dueAfter = (key: string, freshForMs: number | null) =>
    afterExpiry(
      freshForMs,
      WATCHING_MS,
      kept.has(key) ? WATCHING_MS * (1 - JITTER / 2 + random() * JITTER) : WATCHING_MS * random(),
    );
  const fresh = read.flatMap(([key, watching]) => {
    if (watching) return [[key, { due: now + dueAfter(key, watching.freshForMs), source: watching.source }] as const];
    // A read that failed keeps what it had and waits a minute, so an API outage costs a read a minute per title.
    const had = kept.get(key);
    return had ? [[key, { ...had, due: now + RETRY_MS }] as const] : [];
  });
  const failed = Object.fromEntries(
    read.flatMap(([key, watching]) => (!watching && !kept.has(key) ? [[key, now + RETRY_MS] as const] : [])),
  );
  // Nothing was due: hand back the same state, so the refresher can skip the rest of its step.
  if (read.length === 0 && trending === state.trending && total === state.total) return state;
  const stillFailed = Object.entries(state.failed ?? {}).filter(([key, until]) => until > now && !(key in failed));
  return {
    trending,
    total,
    watching: Object.fromEntries([...kept, ...fresh]),
    failed: Object.fromEntries([...stillFailed, ...Object.entries(failed)]),
  };
}
