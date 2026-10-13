import { api } from '../api/api.ts';
import type { MediaType } from './loadChart.ts';

/** Everyone watching each type right now. */
export type LiveNow = Readonly<Record<MediaType, number>>;

type Client = ReturnType<typeof api>;

/** The API's largest page. */
const PER_PAGE = 250;
/** Shows run to about 4 pages; past this the tail is a watcher or two a title. */
const MAX_PAGES = 8;
const TTL_MS = 5 * 60_000;

async function trendingPage(client: Client, type: MediaType, page: number) {
  const query = { page, limit: PER_PAGE };
  const response = type === 'shows' ? await client.shows.trending({ query }) : await client.movies.trending({ query });
  if (response.status !== 200) return null;

  const count = (name: string) => Number.parseInt(response.headers.get(name) ?? '', 10) || 0;
  return {
    // The API sums the watchers of the rows it sends, not the whole chart.
    watchers: count('x-trending-user-count'),
    items: count('x-pagination-item-count'),
  };
}

async function watchersOf(client: Client, type: MediaType): Promise<number | null> {
  const first = await trendingPage(client, type, 1);
  if (!first) return null;

  const pages = Math.min(Math.ceil(first.items / PER_PAGE), MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: Math.max(pages - 1, 0) }, (_, i) => trendingPage(client, type, i + 2)),
  );
  // A page that fails leaves the count a little short rather than losing the section.
  return [first, ...rest].reduce((sum, page) => sum + (page?.watchers ?? 0), 0);
}

/**
 * Trending's Live now: how many people are watching shows and movies. The API only
 * counts the rows it sends, so each chart is read whole, a page of 250 at a time. Unfiltered and public, so it reads
 * the same whatever the page filters, and kept for 5 minutes so paging the chart doesn't ask again. Null unless both
 * answer, since the section compares them; a failure isn't kept.
 */
export function createLiveNow(ttlMs = TTL_MS) {
  let kept: { at: number; live: Promise<LiveNow | null> } | undefined;

  async function load(fetch: typeof globalThis.fetch): Promise<LiveNow | null> {
    const client = api({ fetch });
    const watchers = (type: MediaType) => watchersOf(client, type).catch(() => null);
    const [shows, movies] = await Promise.all([watchers('shows'), watchers('movies')]);
    return shows !== null && movies !== null ? { shows, movies } : null;
  }

  return (fetch: typeof globalThis.fetch, now = Date.now()): Promise<LiveNow | null> => {
    if (kept && now - kept.at < ttlMs) return kept.live;

    const live = load(fetch);
    kept = { at: now, live };
    void live.then((value) => {
      if (!value && kept?.live === live) kept = undefined;
    });
    return live;
  };
}

export const fetchLiveNow = createLiveNow();
