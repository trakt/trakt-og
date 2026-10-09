import type { ListFilter } from './advancedFilters.ts';

/** A list filter as an include/exclude picker shows it: the values kept and the values left out. */
export type ListSelection = { readonly include: readonly string[]; readonly exclude: readonly string[] };

/** What a list filter keeps and leaves out. OG's "none" leaves every value out. */
export function listSelection(list: ListFilter): ListSelection {
  if (list.mode === 'none') return { include: [], exclude: [...list.values, ...(list.excluded ?? [])] };
  return { include: list.values, exclude: list.excluded ?? [] };
}

/**
 * The list filter for a picker's selection, written the way OG's URLs read: only left-out values become "none", and
 * a list that keeps values holds its left-out ones in `excluded`. An "all" list stays "all" while it keeps values.
 */
export function toListFilter(selection: ListSelection, mode: ListFilter['mode'] = 'any'): ListFilter {
  const { include, exclude } = selection;
  if (include.length === 0) return { values: exclude, mode: exclude.length > 0 ? 'none' : 'any' };
  const kept = mode === 'all' ? 'all' : 'any';
  return exclude.length > 0 ? { values: include, mode: kept, excluded: exclude } : { values: include, mode: kept };
}
