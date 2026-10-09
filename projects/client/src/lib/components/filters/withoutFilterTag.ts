import { type AdvancedFilters, listFilterKeys, rangeFilterKeys } from './advancedFilters.ts';

/**
 * The filters without the one a tag stands for, from `filterTags`' ids: `query`, a range key, `genres-drama` for a
 * kept (or OG "none") value and `genres--crime` for a left-out one, plus `watchnow-netflix` for a service.
 */
export function withoutFilterTag(filters: AdvancedFilters, id: string): AdvancedFilters {
  if (id === 'query') return { ...filters, query: '' };
  if (id.startsWith('watchnow-')) {
    const slug = id.slice('watchnow-'.length);
    return { ...filters, watchnow: filters.watchnow.filter((value) => value !== slug) };
  }
  const range = rangeFilterKeys.find((key) => key === id);
  if (range) return { ...filters, [range]: null };

  const key = listFilterKeys.find((name) => id.startsWith(`${name}-`));
  if (!key) return filters;
  const rest = id.slice(key.length + 1);
  const list = filters[key];
  if (rest.startsWith('-')) {
    const excluded = (list.excluded ?? []).filter((value) => value !== rest.slice(1));
    return { ...filters, [key]: { values: list.values, mode: list.mode, ...(excluded.length > 0 && { excluded }) } };
  }
  const values = list.values.filter((value) => value !== rest);
  const excluded = list.excluded ?? [];
  // With nothing kept, a list that only leaves values out is OG's "none".
  return {
    ...filters,
    [key]: values.length === 0 && excluded.length > 0
      ? { values: excluded, mode: 'none' }
      : { values, mode: values.length === 0 ? 'any' : list.mode, ...(excluded.length > 0 && { excluded }) },
  };
}
