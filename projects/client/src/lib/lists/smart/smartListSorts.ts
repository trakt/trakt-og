import { listItemSorts } from '../listItemSorts.ts';

// The sorts the smart list items route takes. It has no personal sorts, popularity or added date.
const SORTS = new Set([
  'rank',
  'title',
  'released',
  'runtime',
  'random',
  'percentage',
  'imdb_rating',
  'tmdb_rating',
  'rt_tomatometer',
  'rt_audience',
  'metascore',
  'votes',
  'imdb_votes',
  'tmdb_votes',
]);

/** A smart list page's sort menu: the list page's, less what a smart list can't sort by. */
export const smartListSorts = listItemSorts.filter(({ by }) => SORTS.has(by));
