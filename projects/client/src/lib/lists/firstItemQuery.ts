import type { ListQuery } from './ListQuery.ts';

/** One item off the top of the whole list, whatever the page's filters: for its cover or its first rank. */
export const firstItemQuery = (query: ListQuery): ListQuery => ({
  ...query,
  types: [],
  genres: [],
  hide: [],
  terms: undefined,
  watchnow: undefined,
  page: 1,
  limit: 1,
});
