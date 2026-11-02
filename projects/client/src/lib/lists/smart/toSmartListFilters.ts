import type { AdvancedFilters, RangeFilterKey } from '../../components/filters/advancedFilters.ts';
import { parentalCategories, parentalParam } from '../../components/filters/parentalGuide.ts';
import type { SmartListFilters } from './SmartList.ts';
import { smartListFilterKeys } from './smartListFilterKeys.ts';

const { lists: LISTS, ranges: RANGES } = smartListFilterKeys;

const exclude = (value: string) => `-${value}`;

/**
 * The chart's applied filters as a smart list saves them: lists as arrays with OG's `-` for "leave out", "all" as
 * `genres_operator: 'and'`, ranges as `[min, max]`, and each parental guide limit as `[0, level]`.
 */
export function toSmartListFilters(filters: AdvancedFilters): SmartListFilters {
  const lists = (Object.keys(LISTS) as (keyof typeof LISTS)[]).flatMap((key) => {
    const { values, mode, excluded = [] } = filters[key];
    if (values.length === 0) return [];
    const kept = mode === 'none' ? values.map(exclude) : values;
    const entry = [LISTS[key], [...kept, ...excluded.map(exclude)]] as const;
    return key === 'genres' && mode === 'all' ? [entry, ['genres_operator', 'and'] as const] : [entry];
  });
  const ranges = (Object.keys(RANGES) as RangeFilterKey[]).flatMap((key) => {
    const range = filters[key];
    return range ? [[RANGES[key], [...range]] as const] : [];
  });
  const watchnow = filters.watchnow.length > 0 ? [['watchnow', [...filters.watchnow]] as const] : [];
  const parental = parentalCategories.flatMap((category) => {
    const level = filters.parental[category];
    return level === undefined ? [] : [[parentalParam(category), [0, level]] as const];
  });

  return Object.fromEntries([...watchnow, ...lists, ...ranges, ...parental]);
}
