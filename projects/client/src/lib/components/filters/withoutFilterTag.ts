import { type AdvancedFilters, emptyFilters, listFilterKeys, rangeFilterKeys } from './advancedFilters.ts';

const clearable = ['query', 'watchnow', 'parental', ...listFilterKeys, ...rangeFilterKeys] as const;

/** The filters without the one a tag stands for, from `filterTags`' ids: the filter's own key. */
export function withoutFilterTag(filters: AdvancedFilters, id: string): AdvancedFilters {
  const key = clearable.find((name) => name === id);
  return key ? { ...filters, [key]: emptyFilters[key] } : filters;
}
