import { cachedOnActivity } from '../../activity/cachedOnActivity.ts';
import type { LastActivitiesResponse } from '@trakt/api';
import type { ReadLastActivities } from '../../activity/createLastActivities.ts';
import { api } from '../../api/api.ts';
import { recentReads } from '../../api/recentReads.ts';
import { cachedComputedStats } from '../../stats/cachedComputedStats.ts';
import { fetchComputedStats } from '../../stats/fetchComputedStats.ts';
import type { StatsCounts } from '../../stats/StatsCounts.ts';
import type { UserStats } from '../../stats/userStatsSchema.ts';
import { fetchRecentHistory } from '../fetchRecentHistory.ts';
import { profileAccess } from '../profileAccess.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import { boxExtraLoader } from './boxes/boxExtraLoader.ts';
import type { BoxFrame } from './boxes/BoxFrame.ts';
import type { BoxInput } from './boxes/BoxInput.ts';
import { boxMath } from './boxes/boxMath.ts';
import { profileBoxes } from './boxes/profileBoxes.ts';
import { toProfileBoxes } from './boxes/toProfileBoxes.ts';
import { fetchWatchedLists } from './fetchWatchedLists.ts';
import { hasActivity } from './hasActivity.ts';
import { toMostWatched } from './toMostWatched.ts';
import type { MostWatched, MostWatchedPrefs } from './toMostWatched.ts';

type Strip = Pick<BoxInput, 'latest' | 'genres'> & {
  /** The counts the loader read, for a profile the API keeps no stats for. */
  readonly counts: StatsCounts | null;
};

type Params = {
  profile: ProfileUser;
  /** The API's stats, or null when og counts them itself. */
  stats: UserStats | null;
  isSelf: boolean;
  /** What the loader read for the boxes, or null when the strip doesn't show. */
  strip: Strip | null;
  /** Your saved Most Watched sorts and tabs; nobody else's can be known. */
  prefs: {
    readonly most_watched_shows: MostWatchedPrefs;
    readonly most_watched_movies: MostWatchedPrefs;
  } | null;
  now: Date;
  /** The browser's signed-in fetch. */
  signedIn: typeof fetch;
  /** Reads for someone else's public profile, so they use the visitor's own rate limit. */
  plain?: typeof fetch;
  activities: ReadLastActivities;
  /** Your saved panels show at once; when your activity has moved since, their fresh reads arrive here. */
  onUpdate?: (panels: Partial<ProfilePanels>) => void;
  cache?: Pick<Parameters<typeof cachedComputedStats>[0], 'storage' | 'now'>;
  /** Someone else's panels, kept in memory for a few minutes. */
  memory?: Pick<typeof recentReads, 'read'>;
};

type BoxEntries = Awaited<ReturnType<typeof toProfileBoxes>>;

export type ProfilePanels = {
  readonly boxes: Promise<BoxEntries | null>;
  readonly mostWatched: Promise<{
    readonly shows: MostWatched;
    readonly movies: MostWatched;
    readonly windowStart: string;
  }>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Starts `read` the first time it's asked for, then hands back the same read. */
const once = <T>(read: () => Promise<T>) => {
  let started: Promise<T> | undefined;
  return () => {
    if (!started) {
      started = read();
      // A failure shows where the page awaits it; a read a navigation leaves behind has nobody waiting on it.
      started.catch(() => undefined);
    }
    return started;
  };
};

type Boxes = { readonly frame: BoxFrame; readonly extras: ReturnType<typeof boxExtraLoader> };

/**
 * When the strip shows, starts every extra request a box could use. A private profile's go with the viewer's token.
 */
function startBoxes(frame: BoxFrame, fetch: typeof globalThis.fetch): Boxes | null {
  if (frame.profile.isLocked || !hasActivity(frame.stats)) return null;
  const extras = boxExtraLoader({ fetch, token: null, id: frame.profile.slug });
  for (const box of profileBoxes) box.prefetch(frame, extras);
  return { frame, extras };
}

/**
 * The panels that need the whole watched lists and the last 30 days of plays, which take several times as long as every
 * other read on the profile, so the browser reads them and the Worker never pages through them: the stat boxes and
 * Most Watched.
 *
 * Your own profile, and a private one you may see, read with your token; someone else's public profile reads without
 * one. On your own, the boxes and Most Watched are saved and show at once, then swap for a fresh read when your activity
 * moved; og's own stats share the dashboard's saved copy. Someone else's can't be keyed on their activity, so they're
 * kept in memory for a few minutes instead. The watched lists themselves are never kept, and are read only when a panel
 * needs them.
 */
export function startProfilePanels({
  profile,
  stats,
  isSelf,
  strip,
  prefs,
  now,
  signedIn,
  plain = globalThis.fetch,
  activities,
  onUpdate = () => {},
  cache = {},
  memory = recentReads,
}: Params): ProfilePanels {
  const id = profile.slug;
  const fetch = isSelf || profileAccess(profile) === 'viewer' ? signedIn : plain;
  const client = api({ fetch });
  const counting = stats === null;

  const recent = once(() => fetchRecentHistory({ client, id, now }));
  // Stats counted here need every watched item, and your own need your shows' episodes too.
  const watched = once(() => fetchWatchedLists({ fetch, id, progress: isSelf && counting, full: counting }));

  const today = boxMath.utcDay(now);
  const readMostWatched = () =>
    Promise.all([recent(), watched()]).then(([history, lists]) => ({
      shows: toMostWatched('shows', {
        history: history.episodes,
        watched: lists.shows,
        prefs: prefs?.most_watched_shows,
      }),
      movies: toMostWatched('movies', {
        history: history.movies,
        watched: lists.movies,
        prefs: prefs?.most_watched_movies,
      }),
      // OG's first tab, `start_at` in its see-more link.
      windowStart: history.start,
    }));

  async function readStats(counts: StatsCounts | null) {
    if (stats) return stats;
    if (!counts) return null;
    const read = () =>
      fetchComputedStats({ fetch, token: null, id, isSelf, counts: Promise.resolve(counts), watched: watched() });
    return isSelf ? cachedComputedStats({ activities, user: id, counts, read, ...cache }) : read();
  }

  async function readBoxes({ counts, ...loaded }: Strip) {
    const watchlist = client.users.watchlist.all({
      params: { id, sort: 'rank' },
      query: { extended: 'full', limit: 3 },
    });
    watchlist.catch(() => undefined);
    const known = await readStats(counts);
    if (!known) return null;
    const started = startBoxes({ profile, stats: known, isSelf }, profile.isPrivate ? signedIn : plain);
    if (!started) return null;

    const [list, history, lists] = await Promise.all([watchlist, recent(), watched()]);
    const listed = list.status === 200 ? list : null;
    return toProfileBoxes(
      {
        ...started.frame,
        ...loaded,
        today,
        recent: history,
        watchlist: {
          count: Number(listed?.headers.get('x-pagination-item-count')) || 0,
          rows: listed?.body ?? [],
        },
        watched: lists,
      },
      started.extras,
    );
  }

  const access = fetch === signedIn ? 'viewer' : 'plain';
  const keep = <T>(
    panel: keyof ProfilePanels,
    key: (latest: LastActivitiesResponse) => unknown,
    read: () => Promise<T>,
  ) =>
    isSelf
      ? cachedOnActivity({
          name: `profile-${panel}`,
          activities,
          user: id,
          key,
          read,
          maxAgeMs: DAY_MS,
          onUpdate: (value) => onUpdate({ [panel]: Promise.resolve(value) } as Partial<ProfilePanels>),
          ...cache,
        })
      : memory.read(`profile:${id}:${access}:${panel}`, read);

  return {
    // Any activity can move a box (ratings, lists, the watchlist), so they key on the latest of all of it.
    boxes: strip
      ? keep(
          'boxes',
          (latest) => [latest.all, today, profile, stats, strip],
          () => readBoxes(strip),
        )
      : Promise.resolve(null),
    mostWatched: keep(
      'mostWatched',
      (latest) => [latest.movies.watched_at, latest.episodes.watched_at, prefs, today],
      readMostWatched,
    ),
  };
}
