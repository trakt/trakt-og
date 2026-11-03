import {
  type AdvancedFilters,
  type ListFilterKey,
  listFilterKeys,
  type RangeFilterKey,
  rangeFilterKeys,
} from './advancedFilters.ts';
import { type ParentalCategory, parentalCategories, parentalParam } from './parentalGuide.ts';

export type FilterChange = { readonly id: string; readonly action: 'set' | 'reset' };

// trakt-web's FilterKey for each og filter. og's own (languages, networks, the other sites' ratings) keep their name.
const LIST_IDS: Readonly<Record<ListFilterKey, string>> = {
  genres: 'genres',
  certifications: 'certifications',
  languages: 'languages',
  countries: 'countries',
  networks: 'networks',
  status: 'statuses',
  episode_types: 'episode_types',
};

type FilterValue = (filters: AdvancedFilters) => string | null;

const listValue =
  (key: ListFilterKey): FilterValue =>
  (filters) => {
    const { values, mode, excluded = [] } = filters[key];
    return values.length > 0 ? JSON.stringify([mode, values, excluded]) : null;
  };

const rangeValue =
  (key: RangeFilterKey): FilterValue =>
  (filters) =>
    filters[key]?.join('-') ?? null;

const parentalValue =
  (category: ParentalCategory): FilterValue =>
  ({ parental }) =>
    parental[category]?.toString() ?? null;

const FILTER_VALUES: ReadonlyArray<readonly [string, FilterValue]> = [
  ['query', ({ query }) => query.trim() || null],
  ['watchnow', ({ watchnow }) => (watchnow.length > 0 ? watchnow.join(',') : null)],
  ...listFilterKeys.map((key) => [LIST_IDS[key], listValue(key)] as const),
  ...rangeFilterKeys.map((key) => [key, rangeValue(key)] as const),
  ...parentalCategories.map((category) => [parentalParam(category), parentalValue(category)] as const),
];

/** Each filter that differs between two filter sets, by trakt-web's id: set when it has a value, reset when cleared. */
export function filterChanges(before: AdvancedFilters, after: AdvancedFilters): readonly FilterChange[] {
  return FILTER_VALUES.flatMap(([id, value]) => {
    const next = value(after);
    if (value(before) === next) return [];
    return [{ id, action: next === null ? 'reset' : 'set' } as const];
  });
}
