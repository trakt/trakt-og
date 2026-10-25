import type { OverlaySlices } from '../overlay/OverlaySlices.ts';
import type { UserStats } from '../stats/userStatsSchema.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import { fanartSchema } from './fanartSchema.ts';
import { fetchStarterPicks, interleave, type StarterPick } from './starterPicks.ts';

/** Ten titles give Up Next, the calendar, stats and recommendations something to show. */
export const FIRST_NIGHT_GOAL = 10;

/** What the counter's titles unlock on the way to the goal. */
export const firstNightUnlocks = [
  { at: 1, short: 'Up Next', text: 'Up Next starts tracking' },
  { at: 3, short: 'Calendar', text: 'Your calendar fills in' },
  { at: 5, short: 'Picks', text: 'Recommendations wake up' },
  { at: FIRST_NIGHT_GOAL, short: 'Stats', text: 'Stats and profile come alive' },
] as const;

export type FirstNightTab = {
  readonly key: 'shows' | 'movies' | 'trending';
  readonly label: string;
  readonly picks: readonly StarterPick[];
};

export type FirstNight = {
  readonly tabs: readonly FirstNightTab[];
  /** Breaking Bad's fanart, behind the wall. */
  readonly backdrop?: string;
};

/** Two rows of the wall's six. */
const PER_TAB = 12;

/** An account that has watched fewer titles than the goal still gets the welcome wall. */
export const isNewAccount = (stats: Pick<UserStats, 'movies' | 'shows'>) =>
  stats.movies.watched + stats.shows.watched < FIRST_NIGHT_GOAL;

/** The wall sits over Breaking Bad's fanart. Without it, the wall's glow alone. */
async function fetchBackdrop(fetch: typeof globalThis.fetch): Promise<string | undefined> {
  try {
    const response = await rawApiFetch({ fetch, path: '/shows/breaking-bad?extended=images' });
    if (!response.ok) return undefined;
    const show = fanartSchema.safeParse(await response.json().catch(() => null));
    return imageUrl(show.data?.images?.fanart?.at(0), 'full');
  } catch {
    return undefined;
  }
}

/**
 * The welcome wall's tabs: the most watched shows and movies of all time, which most people have seen some of, and what's
 * trending now. Read without a token; a chart that fails leaves its tab out.
 */
export async function fetchFirstNight({ fetch, now = new Date() }: { fetch: typeof globalThis.fetch; now?: Date }) {
  const picks = (chart: 'watched/all' | 'trending', type: 'shows' | 'movies') =>
    fetchStarterPicks({ fetch, chart, type, limit: PER_TAB, now });
  const [shows, movies, trendingShows, trendingMovies, backdrop] = await Promise.all([
    picks('watched/all', 'shows'),
    picks('watched/all', 'movies'),
    picks('trending', 'shows'),
    picks('trending', 'movies'),
    fetchBackdrop(fetch),
  ]);
  const tabs: FirstNightTab[] = [
    { key: 'shows' as const, label: 'Most watched shows', picks: shows },
    { key: 'movies' as const, label: 'Most watched movies', picks: movies },
    {
      key: 'trending' as const,
      label: 'Trending now',
      picks: interleave(trendingShows, trendingMovies).slice(0, PER_TAB),
    },
  ].filter((tab) => tab.picks.length > 0);
  return { tabs, backdrop } satisfies FirstNight;
}

/**
 * Every show and movie the member has done something with: watched, watchlisted, rated or favorited, counted once.
 * Null until the overlay has loaded its watched slices.
 */
export function trackedTitles(slices: Partial<OverlaySlices>): number | null {
  if (!slices.watchedMovies || !slices.watchedShows) return null;
  const keys = new Set<string>();
  const add = (type: 'movie' | 'show', ids: Iterable<number> | undefined) => {
    for (const id of ids ?? []) keys.add(`${type}:${id}`);
  };
  add('movie', slices.watchedMovies.keys());
  add('show', slices.watchedShows.keys());
  add('movie', slices.watchlist?.movie);
  add('show', slices.watchlist?.show);
  add('movie', slices.ratings?.movie.keys());
  add('show', slices.ratings?.show.keys());
  add('movie', slices.favorites?.movie);
  add('show', slices.favorites?.show);
  return keys.size;
}
