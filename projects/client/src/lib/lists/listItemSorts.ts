import type { SortHow } from './ListQuery.ts';

/** A list type in OG's type dropdown and in the API's type path segment. */
export type ListItemType = 'movie' | 'show' | 'season' | 'episode' | 'person';

/** The list dialogs' sort field group. `site` and `votes` get a header over them, `mine` is signed-in only. */
export type ListSortGroup = 'main' | 'site' | 'votes' | 'mine';

/** The site a rating or votes sort reads, which groups it in the list page's sort menu. */
export type ListSortSite = 'trakt' | 'imdb' | 'tmdb' | 'rt' | 'metacritic';

export type ListItemSort = {
  readonly by: string;
  readonly label: string;
  readonly group: ListSortGroup;
  /** The types it applies to. Left out, every type. Hidden when none of the chosen types match. */
  readonly types?: readonly ListItemType[];
  /** Starts newest or highest first: dates, scores and votes. The rest start first to last, A to Z. */
  readonly descending?: true;
  /** The sort menu only: the API can't save it as a list's default sort. */
  readonly browseOnly?: true;
  readonly site?: ListSortSite;
  /** Its name under its site or group in the sort menu, without the site ("Votes" for IMDB Votes). */
  readonly short?: string;
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
  { by: 'random', label: 'Random', group: 'main' },
  { by: 'percentage', label: 'Trakt Percentage', group: 'site', site: 'trakt', short: 'Percentage', descending: true },
  {
    by: 'imdb_rating',
    label: 'IMDB Rating',
    group: 'site',
    site: 'imdb',
    short: 'Rating',
    types: ratedTypes,
    descending: true,
  },
  {
    by: 'tmdb_rating',
    label: 'TMDB User Score',
    group: 'site',
    site: 'tmdb',
    short: 'User Score',
    types: ratedTypes,
    descending: true,
  },
  {
    by: 'rt_tomatometer',
    label: 'RT Tomatometer',
    group: 'site',
    site: 'rt',
    short: 'Tomatometer',
    types: ['movie', 'show'],
    descending: true,
  },
  {
    by: 'rt_audience',
    label: 'RT Audience Score',
    group: 'site',
    site: 'rt',
    short: 'Audience Score',
    types: ['movie', 'show'],
    descending: true,
  },
  {
    by: 'metascore',
    label: 'Metascore',
    group: 'site',
    site: 'metacritic',
    short: 'Metascore',
    types: ['movie'],
    descending: true,
  },
  { by: 'votes', label: 'Trakt Votes', group: 'votes', site: 'trakt', short: 'Votes', descending: true },
  {
    by: 'imdb_votes',
    label: 'IMDB Votes',
    group: 'votes',
    site: 'imdb',
    short: 'Votes',
    types: ratedTypes,
    descending: true,
  },
  {
    by: 'tmdb_votes',
    label: 'TMDB Votes',
    group: 'votes',
    site: 'tmdb',
    short: 'Votes',
    types: ratedTypes,
    descending: true,
  },
  { by: 'my_rating', label: 'My Rating', group: 'mine', short: 'Rating', descending: true },
  { by: 'plays', label: 'My Plays', group: 'mine', short: 'Plays', descending: true, browseOnly: true },
  { by: 'watched', label: 'My Watched Date', group: 'mine', short: 'Watched Date', descending: true },
  { by: 'collected', label: 'My Library Date', group: 'mine', short: 'Library Date', descending: true },
];

/**
 * OG's Popularity sorts by the same vote count as Trakt Votes, so the menu leaves it out, and old links, lists saved
 * with it as their default and the API's own defaults read as Trakt Votes.
 */
export const canonicalSortBy = (by: string) => (by === 'popularity' ? 'votes' : by);

/** The direction a sort starts in when it's picked. */
export const listSortHow = (by: string): SortHow =>
  listItemSorts.find((sort) => sort.by === by)?.descending ? 'desc' : 'asc';

/** A sort's direction, flipped or not from its own. */
export const reverseHow = (by: string, flipped: boolean): SortHow => {
  const own = listSortHow(by);
  if (!flipped) return own;
  return own === 'asc' ? 'desc' : 'asc';
};
