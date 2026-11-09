import { fetchComputedStats } from '../../stats/fetchComputedStats.ts';
import { fetchStatsCounts } from '../../stats/fetchStatsCounts.ts';
import type { StatsCounts } from '../../stats/StatsCounts.ts';
import type { UserStats } from '../../stats/userStatsSchema.ts';
import { api } from '../../api/api.ts';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import { toPanelSettings } from '../../settings/toPanelSettings.ts';
import type { ViewerSettings } from '../../settings/ViewerSettings.ts';
import { toUserComment } from '../comments/toUserComment.ts';
import type { UserCommentRow } from '../comments/UserCommentRow.ts';
import { fetchRecentHistory } from '../fetchRecentHistory.ts';
import { profileAccess } from '../profileAccess.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import { readProfileTab } from '../readProfileTab.ts';
import { boxExtraLoader } from './boxes/boxExtraLoader.ts';
import type { BoxFrame } from './boxes/BoxFrame.ts';
import type { BoxInput } from './boxes/BoxInput.ts';
import { boxMath } from './boxes/boxMath.ts';
import { profileBoxes } from './boxes/profileBoxes.ts';
import { toProfileBoxes } from './boxes/toProfileBoxes.ts';
import { fetchWatchedGenres } from './fetchWatchedGenres.ts';
import { fetchWatchedLists } from './fetchWatchedLists.ts';
import { toGenreBar } from './toGenreBar.ts';
import { toMostWatched } from './toMostWatched.ts';
import { toFavoriteCard, toWatchedEpisode, toWatchedMovie } from './toProfileSummary.ts';
import { toProfileRatings } from './toProfileRatings.ts';

type Params = {
  fetch: typeof fetch;
  locals: { token: string | null };
  params: { id: string };
  parent: () => Promise<{
    profile: ProfileUser;
    stats: UserStats | null;
    isSelf: boolean;
    datePreferences: DatePreferences;
    /** The viewer's own settings, from the root layout. */
    settings: ViewerSettings | null;
  }>;
  now?: Date;
};

type Client = ReturnType<typeof api>;
type Frame = Awaited<ReturnType<Params['parent']>>;
type FavoritesSort = { readonly sort_by: string; readonly sort_how: 'asc' | 'desc' };

// OG's default, and the only order another viewer can know: the owner's saved sort is
// in their own `/users/settings`. The worker reshuffles Random daily.
const RANDOM: FavoritesSort = { sort_by: 'random', sort_how: 'asc' };

// LIST_SORT_OPTIONS all default to `asc`, so the saved direction is the worker's as-is.
const fetchFavorites = (client: Client, id: string, sort: FavoritesSort) =>
  client.users.favorites.typedSorted({
    params: { id, type: 'movie,show', ...sort },
    query: { extended: 'full', limit: 3 },
  });

/** Your own panel settings on your own profile; nobody else's can be known. */
const profilePrefs = ({ isSelf, settings }: Pick<Frame, 'isSelf' | 'settings'>) =>
  isSelf ? toPanelSettings(settings).profile : null;

const favoritesSortOf = (frame: Pick<Frame, 'isSelf' | 'settings'>): FavoritesSort =>
  profilePrefs(frame)?.favorites ?? RANDOM;

async function fetchSections(
  { fetch, token, progress = false }: { fetch: typeof globalThis.fetch; token?: string | null; progress?: boolean },
  id: string,
  now: Date,
  favoritesSort: FavoritesSort = RANDOM,
) {
  const client = api({ fetch, token });
  const history = { params: { id }, query: { extended: 'full' } } as const;

  // Only the boxes and Most Watched read these, and the page streams both, so the slowest reads never hold it up.
  const streamed = {
    watchlist: client.users.watchlist.all({
      params: { id, sort: 'rank' },
      query: { extended: 'full', limit: 3 },
    }),
    recent: fetchRecentHistory({ client, id, now }),
    watched: fetchWatchedLists({ fetch, token, id, progress }),
  };
  // A failure shows where the page awaits it. A read the frame cancels, or one a failed section strands, has nobody
  // waiting on it.
  for (const read of Object.values(streamed)) read.catch(() => undefined);

  const [episodes, movies, favorites, comments, genres] = await Promise.all([
    client.users.history.episodes({ ...history, query: { ...history.query, limit: 4 } }),
    client.users.history.movies({ ...history, query: { ...history.query, limit: 6 } }),
    fetchFavorites(client, id, favoritesSort),
    // Newest first, the one order the worker has: OG's Recent tab.
    client.users.comments({
      params: { id, comment_type: 'all', type: 'all' },
      query: { extended: 'full', limit: 3 },
    }),
    fetchWatchedGenres({ fetch, token, id }),
  ]);

  return { episodes, movies, favorites, comments, genres, streamed };
}

type Streamed = Awaited<ReturnType<typeof fetchSections>>['streamed'];

/**
 * The profile page under the frame: the stat boxes or the welcome hero, favorites, the
 * recently watched rows, the genre and ratings charts, the most watched columns and the newest comments, read once per
 * `readProfileTab`: someone else's public profile goes without the token alongside the frame's load, and your own, or a
 * private profile you may see, is read with it. On your own profile your saved favorites sort, most watched sorts and
 * default tabs apply.
 *
 * The boxes and Most Watched stream: they need the whole watched lists, which take several times as long as every
 * other section. The frame already says whether the strip shows, so its place is held from the first paint.
 */
export async function loadProfile({ fetch, locals, params, parent, now = new Date() }: Params) {
  // The boxes' extra requests start as soon as the frame says which ones could pay off, alongside the sections.
  const frame = parent();
  const token = locals.token;
  const [tab, apiBoxes, counts] = await Promise.all([
    readProfileTab({
      fetch,
      token,
      frame,
      read: ({ fetch, token, frame: known }) =>
        fetchSections(
          // Your own stats counted here need your shows' episodes.
          { fetch, token, progress: !!known?.isSelf && known.stats === null },
          params.id,
          now,
          token && known ? favoritesSortOf(known) : RANDOM,
        ),
    }),
    frame.then((data) => startBoxes(data, { fetch, token, id: params.id })),
    frame.then((data) => readCounts(data, { fetch, token })),
  ]);
  const { profile, stats, isSelf, datePreferences, settings } = tab.frame;
  const sections = tab.result;

  if (!sections) {
    return {
      boxes: null,
      welcome: false,
      favorites: [],
      episodes: [],
      movies: [],
      charts: null,
      mostWatched: null,
      comments: [],
    };
  }

  const prefs = profilePrefs({ isSelf, settings });
  const episodes = sections.episodes.status === 200 ? sections.episodes.body : [];
  const movies = sections.movies.status === 200 ? sections.movies.body : [];
  const favorites = sections.favorites.status === 200 ? sections.favorites.body : [];
  const comments: readonly UserCommentRow[] = sections.comments.status === 200 ? sections.comments.body : [];
  const loaded = {
    today: boxMath.utcDay(now),
    latest: { episode: episodes.at(0), movie: movies.at(0) },
    genres: sections.genres,
  };
  // Without the API's stats, a profile with any history counts its own for the boxes.
  const active = stats ? hasActivity(stats) : episodes.length + movies.length > 0;
  const computed =
    !stats && counts && active
      ? fetchComputedStats({
          fetch,
          token: statsToken(tab.frame, token),
          id: profile.slug,
          isSelf,
          counts: Promise.resolve(counts),
          watched: sections.streamed.watched,
        })
      : null;
  const ratings = stats?.ratings ?? counts?.ratings;

  return {
    boxes: apiBoxes
      ? streamBoxes(apiBoxes, sections.streamed, loaded)
      : (computed?.then((computedStats) => {
          const boxes = startBoxes({ profile, stats: computedStats, isSelf }, { fetch, token, id: params.id });
          return boxes ? streamBoxes(boxes, sections.streamed, loaded) : null;
        }) ?? null),
    welcome: isSelf && !active,
    favorites: favorites.map(toFavoriteCard),
    episodes: episodes.map((row) => toWatchedEpisode(row, datePreferences)),
    movies: movies.map((row) => toWatchedMovie(row, datePreferences)),
    // OG hid the whole charts section, ratings too, when there were no genres (`users.js:383-386`).
    charts:
      sections.genres.length > 0
        ? {
            genres: sections.genres.map((row) => toGenreBar(row, { slug: profile.slug })),
            ratings: toProfileRatings({
              distribution: ratings?.distribution,
              types: stats
                ? {
                    movies: stats.movies.ratings,
                    shows: stats.shows.ratings,
                    seasons: stats.seasons.ratings,
                    episodes: stats.episodes.ratings,
                  }
                : counts?.ratings,
            }),
          }
        : null,
    mostWatched: streamMostWatched(sections.streamed, prefs),
    comments: comments.flatMap((row) => toUserComment(row) ?? []),
  };
}

async function streamBoxes(
  { frame, extras }: Boxes,
  streamed: Streamed,
  loaded: Pick<BoxInput, 'today' | 'latest' | 'genres'>,
) {
  const [watchlist, recent, watched] = await Promise.all([streamed.watchlist, streamed.recent, streamed.watched]);
  const listed = watchlist.status === 200 ? watchlist : null;
  return toProfileBoxes(
    {
      ...frame,
      ...loaded,
      recent,
      watchlist: {
        count: Number(listed?.headers.get('x-pagination-item-count')) || 0,
        rows: listed?.body ?? [],
      },
      watched,
    },
    extras,
  );
}

async function streamMostWatched(streamed: Streamed, prefs: ReturnType<typeof profilePrefs>) {
  const [recent, watched] = await Promise.all([streamed.recent, streamed.watched]);
  return {
    shows: toMostWatched('shows', {
      history: recent.episodes,
      watched: watched.shows,
      prefs: prefs?.most_watched_shows,
    }),
    movies: toMostWatched('movies', {
      history: recent.movies,
      watched: watched.movies,
      prefs: prefs?.most_watched_movies,
    }),
    // OG's first tab, `start_at` in its see-more link.
    windowStart: recent.start,
  };
}

/** Whether the user has any activity. Without any, the strip hides: your own profile shows the welcome hero. */
const hasActivity = (stats: UserStats) =>
  [stats.episodes.minutes, stats.movies.minutes, stats.episodes.collected, stats.movies.collected].some((n) => n > 0);

type Boxes = { readonly frame: BoxFrame; readonly extras: ReturnType<typeof boxExtraLoader> };

/** Your own profile, or a private one you may see, reads its counts with your token. */
const statsToken = ({ profile, isSelf }: Pick<Frame, 'profile' | 'isSelf'>, token: string | null) =>
  isSelf || profileAccess(profile) === 'viewer' ? token : null;

/**
 * The counts the API would have sent, for a profile it keeps no stats for: read alongside the sections for the ratings
 * chart, and the boxes' stats then add the watched lists to them. Counts that fail leave both out.
 */
function readCounts(
  frame: Frame,
  { fetch, token }: { fetch: typeof globalThis.fetch; token: string | null },
): Promise<StatsCounts | null> | null {
  if (frame.stats || frame.profile.isLocked) return null;
  return fetchStatsCounts({ fetch, token: statsToken(frame, token), id: frame.profile.slug }).catch(() => null);
}

/**
 * When the profile shows the strip (visible, with stats and some activity), starts every extra request a box could
 * use. A private profile's go with the viewer's token.
 */
function startBoxes(
  { profile, stats, isSelf }: Pick<Frame, 'profile' | 'stats' | 'isSelf'>,
  { token, ...context }: { fetch: typeof fetch; token: string | null; id: string },
): Boxes | null {
  if (profile.isLocked || !stats || !hasActivity(stats)) return null;
  const frame = { profile, stats, isSelf };
  const extras = boxExtraLoader({ ...context, token: profile.isPrivate ? token : null });
  for (const box of profileBoxes) box.prefetch(frame, extras);
  return { frame, extras };
}
