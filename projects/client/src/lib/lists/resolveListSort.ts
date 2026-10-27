import { listItemSorts } from './listItemSorts.ts';
import type { ListQuery, SortHow } from './ListQuery.ts';

export type ListSort = { readonly by: string; readonly how: SortHow };

type ResolveListSortParams = {
  query: Pick<ListQuery, 'sortBy' | 'sortHow'>;
  /** The list's own default sort. */
  fallback: ListSort;
};

/**
 * The sort a list page shows: the URL's, else the list's default. A sort the menu doesn't know is Rank.
 */
export function resolveListSort({ query, fallback }: ResolveListSortParams): ListSort {
  const how = query.sortHow ?? fallback.how;
  const sort = listItemSorts.find(({ by }) => by === (query.sortBy ?? fallback.by));
  if (!sort) return { by: 'rank', how };
  return { by: sort.by, how };
}
