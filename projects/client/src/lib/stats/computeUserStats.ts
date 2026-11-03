import type { WatchedItemRow } from '../users/profile/watchedItemsSchema.ts';
import type { StatsCounts } from './StatsCounts.ts';
import type { UserStats } from './userStatsSchema.ts';

type ShowRow = Extract<WatchedItemRow, { show: unknown }>;
type MovieRow = Extract<WatchedItemRow, { movie: unknown }>;

type Params = {
  counts: StatsCounts;
  watched: { readonly shows: readonly WatchedItemRow[]; readonly movies: readonly WatchedItemRow[] };
  /** The shows you dropped, by Trakt id. Null when unknown (someone else's profile): no progress then. */
  dropped: ReadonlySet<number> | null;
};

const sum = (values: readonly number[]) => values.reduce((total, n) => total + n, 0);
const isShow = (row: WatchedItemRow): row is ShowRow => 'show' in row;
const isMovie = (row: WatchedItemRow): row is MovieRow => 'movie' in row;

const minutes = (rows: readonly { plays: number; runtime: number }[]) =>
  sum(rows.map(({ plays, runtime }) => plays * runtime));

/** Episodes watched outside the specials. */
const uniqueEpisodes = ({ seasons }: ShowRow) =>
  sum(
    (seasons ?? [])
      .filter(({ number }) => number > 0)
      .map(({ episodes }) => episodes.filter((e) => e.plays > 0).length),
  );

/** The stats cron's rule: every aired episode watched, outside a rewatch. */
const isFinished = (row: ShowRow) => {
  const aired = row.show.aired_episodes ?? 0;
  return !row.reset_at && aired > 0 && uniqueEpisodes(row) >= aired;
};

function progress(shows: readonly ShowRow[], dropped: ReadonlySet<number> | null): UserStats['progress'] {
  if (!dropped || shows.some(({ seasons }) => !seasons)) return null;
  const watching = shows.filter(({ show }) => !dropped.has(show.ids.trakt));
  const finished = watching.filter(isFinished).length;
  return { started: watching.length - finished, finished, dropped: dropped.size };
}

/**
 * `/users/:id/stats` counted by og, for an account the API keeps no stats for. The counts are exact. Minutes are plays
 * times runtime, which for shows is the show's typical episode length, so they run a little off the API's. Progress
 * needs the shows' episodes and your dropped shows, so it's your own only. Nothing counts collections or the network.
 */
export function computeUserStats({ counts, watched, dropped }: Params): UserStats {
  const shows = watched.shows.filter(isShow);
  const movies = watched.movies.filter(isMovie);
  const episodePlays = sum(shows.map(({ plays }) => plays));
  const moviePlays = sum(movies.map(({ plays }) => plays));
  const episodeMinutes = minutes(shows.map(({ plays, show }) => ({ plays, runtime: show.runtime ?? 0 })));
  const movieMinutes = minutes(movies.map(({ plays, movie }) => ({ plays, runtime: movie.runtime ?? 0 })));
  const { ratings, comments } = counts;

  return {
    movies: {
      plays: moviePlays,
      watched: counts.watched.movies,
      minutes: movieMinutes,
      collected: 0,
      ratings: ratings.movies,
      comments: comments.movies,
    },
    shows: { watched: counts.watched.shows, collected: 0, ratings: ratings.shows, comments: comments.shows },
    seasons: { ratings: ratings.seasons, comments: comments.seasons },
    episodes: {
      plays: episodePlays,
      watched: counts.watched.episodes,
      minutes: episodeMinutes,
      collected: 0,
      ratings: ratings.episodes,
      comments: comments.episodes,
    },
    network: null,
    ratings: { total: sum(Object.values(ratings.distribution)), distribution: ratings.distribution },
    progress: progress(shows, dropped),
    lists: counts.lists,
    total_minutes: episodeMinutes + movieMinutes,
    total_plays: episodePlays + moviePlays,
  };
}
