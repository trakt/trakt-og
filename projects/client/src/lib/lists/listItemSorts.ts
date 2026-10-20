import type { SortHow } from './ListQuery.ts';

/** A list type in OG's type dropdown and in the API's type path segment. */
export type ListItemType = 'movie' | 'show' | 'season' | 'episode' | 'person';

/** The list page's sort menu group. `site` and `votes` get a header over them, `mine` is signed-in only. */
export type ListSortGroup = 'main' | 'site' | 'votes' | 'mine';

export type ListItemSort = {
  readonly by: string;
  readonly label: string;
  readonly group: ListSortGroup;
  /** VIP only in OG: hidden from everyone else, and falls back to Rank in the URL. */
  readonly vip?: true;
  /** The types it applies to. Left out, every type. Hidden when none of the chosen types match. */
  readonly types?: readonly ListItemType[];
  /** Starts newest or highest first: dates, scores, votes and popularity. The rest start first to last, A to Z. */
  readonly descending?: true;
};

const ratedTypes: readonly ListItemType[] = ['movie', 'show', 'episode'];

/**
 * OG's list sort options, in menu order. The URL's `asc` and `desc` are the direction as-is; picking a sort starts it
 * in its own direction (`listSortHow`).
 */
export const listItemSorts: readonly ListItemSort[] = [
  { by: 'rank', label: 'Rank', group: 'main' },
  { by: 'added', label: 'Added Date', group: 'main', descending: true },
  { by: 'title', label: 'Title', group: 'main' },
  { by: 'released', label: 'Release Date', group: 'main', descending: true },
  { by: 'runtime', label: 'Runtime', group: 'main' },
  { by: 'popularity', label: 'Popularity', group: 'main', descending: true },
  { by: 'random', label: 'Random', group: 'main' },
  { by: 'percentage', label: 'Trakt Percentage', group: 'site', descending: true },
  { by: 'imdb_rating', label: 'IMDB Rating', group: 'site', vip: true, types: ratedTypes, descending: true },
  { by: 'tmdb_rating', label: 'TMDB User Score', group: 'site', vip: true, types: ratedTypes, descending: true },
  {
    by: 'rt_tomatometer',
    label: 'RT Tomatometer',
    group: 'site',
    vip: true,
    types: ['movie', 'show'],
    descending: true,
  },
  {
    by: 'rt_audience',
    label: 'RT Audience Score',
    group: 'site',
    vip: true,
    types: ['movie', 'show'],
    descending: true,
  },
  { by: 'metascore', label: 'Metascore', group: 'site', vip: true, types: ['movie'], descending: true },
  { by: 'votes', label: 'Trakt Votes', group: 'votes', descending: true },
  { by: 'imdb_votes', label: 'IMDB Votes', group: 'votes', vip: true, types: ratedTypes, descending: true },
  { by: 'tmdb_votes', label: 'TMDB Votes', group: 'votes', vip: true, types: ratedTypes, descending: true },
  { by: 'my_rating', label: 'My Rating', group: 'mine', descending: true },
  { by: 'watched', label: 'Watched Date', group: 'mine', descending: true },
  { by: 'collected', label: 'Collected Date', group: 'mine', descending: true },
];

/** The direction a sort starts in when it's picked. */
export const listSortHow = (by: string): SortHow =>
  listItemSorts.find((sort) => sort.by === by)?.descending ? 'desc' : 'asc';

/** A sort's direction, flipped or not from its own. */
export const reverseHow = (by: string, flipped: boolean): SortHow => {
  const own = listSortHow(by);
  if (!flipped) return own;
  return own === 'asc' ? 'desc' : 'asc';
};
