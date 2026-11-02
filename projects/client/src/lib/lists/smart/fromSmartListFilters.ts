import {
  type AdvancedFilters,
  emptyFilters,
  type ListFilter,
  type Range,
  type RangeFilterKey,
} from '../../components/filters/advancedFilters.ts';
import {
  isParentalLevel,
  type ParentalLimits,
  parentalCategories,
  parentalParam,
} from '../../components/filters/parentalGuide.ts';
import type { SmartListFilters } from './SmartList.ts';
import { smartListFilterKeys } from './smartListFilterKeys.ts';

const { lists: LISTS, ranges: RANGES } = smartListFilterKeys;

// Read with the panel's filters, or no-ops: the chart reads the viewer's own region, and "any" is the default match.
const HANDLED = new Set<string>([
  ...Object.values(LISTS),
  ...Object.values(RANGES),
  ...parentalCategories.map(parentalParam),
  'watchnow',
  'genres_operator',
]);
const IGNORED = new Set(['watchnow_country']);

// The panel caps each parental category from None, so only a `[0, level]` range reads; undefined means it can't.
function toParental(filters: SmartListFilters): ParentalLimits | undefined {
  const limits = parentalCategories.map((category) => {
    const range = filters[`parental_${category}`];
    if (range === undefined || range.length === 0) return [category, undefined] as const;
    const [min, max] = range;
    return [category, min === 0 && max !== undefined && isParentalLevel(max) ? max : null] as const;
  });
  if (limits.some(([, level]) => level === null)) return undefined;
  return Object.fromEntries(limits.filter(([, level]) => level !== undefined));
}

const isSet = (value: unknown) =>
  value !== undefined && value !== null && value !== false && !(Array.isArray(value) && value.length === 0);

const NO_LIST: ListFilter = { values: [], mode: 'any' };

function toList(values: readonly string[] | undefined, all: boolean): ListFilter {
  const left = (values ?? []).filter((value) => value.startsWith('-')).map((value) => value.slice(1));
  const kept = (values ?? []).filter((value) => !value.startsWith('-'));
  if (kept.length === 0 && left.length === 0) return NO_LIST;
  if (kept.length === 0) return { values: left, mode: 'none' };
  return { values: kept, mode: all ? 'all' : 'any', ...(left.length > 0 && { excluded: left }) };
}

const toRange = (range: readonly number[] | undefined): Range | null | undefined => {
  if (range === undefined || range.length === 0) return null;
  const [min, max] = range;
  return min !== undefined && max !== undefined ? [min, max] : undefined;
};

/**
 * A smart list's filters as the chart panel's, or null when it holds one the panel can't show (keywords, studios,
 * people, the hide switches, a left-out service, an open-ended range, a parental guide floor or keeping unrated
 * titles). Those lists open as a list instead.
 */
export function fromSmartListFilters(filters: SmartListFilters): AdvancedFilters | null {
  const unknown = Object.entries(filters).some(
    ([key, value]) => isSet(value) && !HANDLED.has(key) && !IGNORED.has(key),
  );
  if (unknown || filters.watchnow?.some((value) => value.startsWith('-'))) return null;

  const ranges = (Object.keys(RANGES) as RangeFilterKey[]).map((key) => [key, toRange(filters[RANGES[key]])] as const);
  const parental = toParental(filters);
  if (ranges.some(([, range]) => range === undefined) || !parental) return null;

  const lists = (Object.keys(LISTS) as (keyof typeof LISTS)[]).map(
    (key) => [key, toList(filters[LISTS[key]], key === 'genres' && filters.genres_operator === 'and')] as const,
  );
  return {
    ...emptyFilters,
    watchnow: [...(filters.watchnow ?? [])],
    parental,
    ...Object.fromEntries(lists),
    ...Object.fromEntries(ranges),
  };
}
