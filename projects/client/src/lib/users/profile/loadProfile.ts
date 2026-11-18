import { fetchStatsCounts } from '../../stats/fetchStatsCounts.ts';
import type { StatsCounts } from '../../stats/StatsCounts.ts';
import type { UserStats } from '../../stats/userStatsSchema.ts';
import { api } from '../../api/api.ts';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import { toPanelSettings } from '../../settings/toPanelSettings.ts';
import type { ViewerSettings } from '../../settings/ViewerSettings.ts';
import { toUserComment } from '../comments/toUserComment.ts';
import type { UserCommentRow } from '../comments/UserCommentRow.ts';
import { profileAccess } from '../profileAccess.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import { readProfileTab } from '../readProfileTab.ts';
import { fetchWatchedGenres } from './fetchWatchedGenres.ts';
import { hasActivity } from './hasActivity.ts';
import { toGenreBar } from './toGenreBar.ts';
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
  { fetch, token }: { fetch: typeof globalThis.fetch; token?: string | null },
  id: string,
  favoritesSort: FavoritesSort = RANDOM,
) {
  const client = api({ fetch, token });
  const history = { params: { id }, query: { extended: 'full' } } as const;

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

  return { episodes, movies, favorites, comments, genres };
}

/**
 * The profile page under the frame: the stat boxes or the welcome hero (the ghost profile on someone else's with
 * nothing to show), favorites, the recently watched rows, the genre and ratings charts and the newest comments, read
 * once per `readProfileTab`: someone else's public profile goes without the token alongside the frame's load, and
 * your own, or a private profile you may see, is read with it. On your own profile your saved favorites sort applies.
 *
 * The stat boxes and Most Watched need the whole watched lists and the last 30 days of plays, which take several times
 * as long as every other section, so the Worker leaves them to the browser (`startProfilePanels`). It returns what
 * they start from: the counts og's own stats begin with, when the API keeps none, and the reads the boxes share with
 * the sections. The frame already says whether the strip shows, so its place is held from the first paint.
 */
export async function loadProfile({ fetch, locals, params, parent }: Params) {
  const frame = parent();
  const token = locals.token;
  const [tab, counts] = await Promise.all([
    readProfileTab({
      fetch,
      token,
      frame,
      read: ({ fetch, token, frame: known }) =>
        fetchSections({ fetch, token }, params.id, token && known ? favoritesSortOf(known) : RANDOM),
    }),
    frame.then((data) => readCounts(data, { fetch, token })),
  ]);
  const { profile, stats, isSelf, datePreferences, settings } = tab.frame;
  const sections = tab.result;

  if (!sections) {
    return {
      panels: null,
      welcome: false,
      ghost: false,
      favorites: [],
      episodes: [],
      movies: [],
      charts: null,
      comments: [],
    };
  }

  const prefs = profilePrefs({ isSelf, settings });
  const episodes = sections.episodes.status === 200 ? sections.episodes.body : [];
  const movies = sections.movies.status === 200 ? sections.movies.body : [];
  const favorites = sections.favorites.status === 200 ? sections.favorites.body : [];
  const comments: readonly UserCommentRow[] = sections.comments.status === 200 ? sections.comments.body : [];
  // Without the API's stats, a profile with any history counts its own for the boxes, from the counts.
  const active = stats ? hasActivity(stats) : episodes.length + movies.length > 0;
  const ratings = stats?.ratings ?? counts?.ratings;

  return {
    panels: {
      strip:
        active && (stats || counts)
          ? { latest: { episode: episodes.at(0), movie: movies.at(0) }, genres: sections.genres, counts }
          : null,
      prefs,
    },
    welcome: isSelf && !active,
    ghost: !isSelf && !active && favorites.length + comments.length + sections.genres.length === 0,
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
    comments: comments.flatMap((row) => toUserComment(row) ?? []),
  };
}

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
