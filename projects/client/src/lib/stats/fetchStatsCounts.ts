import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { StatsCounts } from './StatsCounts.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  token?: string | null;
  id: string;
};

const TYPES = ['movies', 'shows', 'seasons', 'episodes'] as const;
const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/**
 * The counts `/users/:id/stats` would have sent, each from a one-row page's `X-Pagination-Item-Count`: watched,
 * ratings by type and by score, comments by type, and lists. About twenty small reads, all at once. One that fails
 * fails them all, since a missing count would read as zero.
 */
export async function fetchStatsCounts({ fetch, token, id }: Params): Promise<StatsCounts> {
  const user = `/users/${encodeURIComponent(id)}`;
  const count = async (path: string) => {
    const response = await rawApiFetch({
      fetch,
      token,
      path: `${user}/${path}${path.includes('?') ? '&' : '?'}limit=1`,
    });
    if (response.status !== 200) throw new Error(`${path}: ${response.status}`);
    return Number(response.headers.get('x-pagination-item-count')) || 0;
  };
  const counts = (paths: readonly string[]) => Promise.all(paths.map(count));

  const [watched, rated, scores, comments, [lists = 0]] = await Promise.all([
    counts(['watched/movies', 'watched/shows', 'watched/episodes']),
    counts(TYPES.map((type) => `ratings/${type}`)),
    counts(SCORES.map((score) => `ratings/all/${score}`)),
    // The API's counts take in replies.
    counts(TYPES.map((type) => `comments/all/${type}?include_replies=true`)),
    counts(['lists']),
  ]);
  const perType = (values: readonly number[]) => {
    const [movies = 0, shows = 0, seasons = 0, episodes = 0] = values;
    return { movies, shows, seasons, episodes };
  };
  const [movies = 0, shows = 0, episodes = 0] = watched;
  const score = (n: number) => scores.at(n - 1) ?? 0;

  return {
    watched: { movies, shows, episodes },
    ratings: {
      ...perType(rated),
      distribution: {
        1: score(1),
        2: score(2),
        3: score(3),
        4: score(4),
        5: score(5),
        6: score(6),
        7: score(7),
        8: score(8),
        9: score(9),
        10: score(10),
      },
    },
    comments: perType(comments),
    lists,
  };
}
