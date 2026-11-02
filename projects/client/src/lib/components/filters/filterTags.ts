import type { AdvancedFilters, ListFilterKey, RangeFilterKey } from './advancedFilters.ts';
import { listFilterKeys } from './advancedFilters.ts';
import { genreLabel } from '../../utils/genreLabel.ts';
import {
  type ParentalLimits,
  parentalCategories,
  parentalCategoryLabels,
  parentalLimitLabel,
} from './parentalGuide.ts';
import { parentalPreset } from './parentalPreset.ts';

/** The rating site whose logo leads a range tag. */
export type TagSite = 'trakt' | 'imdb' | 'tmdb' | 'rt' | 'rt-audience' | 'letterboxd' | 'mal';

export type FilterTagValue = {
  readonly text: string;
  /** Left out: struck through, as in the panel's fields. */
  readonly without: boolean;
};

/** One applied filter, as the sidebar shows it: its values in the panel field's order, kept before left out. */
export type FilterTag = {
  /** The filter's key: `query`, `watchnow`, a list or range key, or `parental`. */
  readonly id: string;
  readonly values: readonly FilterTagValue[];
  readonly site?: TagSite;
};

const titleCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');

const displayName = (type: 'language' | 'region', code: string) => {
  try {
    const name = new Intl.DisplayNames(['en'], { type }).of(type === 'region' ? code.toUpperCase() : code);
    return name && name.toLowerCase() !== code.toLowerCase() ? name : code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
};

/**
 * How OG named a filter value: genres and statuses title-cased,
 * certifications upper-cased, languages and countries by their English names, networks as they are.
 */
export function filterValueLabel(key: ListFilterKey, value: string): string {
  switch (key) {
    case 'genres':
      return genreLabel(value);
    case 'status':
    case 'episode_types':
      return titleCase(value);
    case 'certifications':
      return value.toUpperCase();
    case 'languages':
      return displayName('language', value);
    case 'countries':
      return displayName('region', value);
    case 'networks':
      return value;
  }
}

const ranges: readonly { key: RangeFilterKey; site?: TagSite; suffix: string; decimals?: number }[] = [
  { key: 'years', suffix: '' },
  { key: 'runtimes', suffix: ' mins' },
  { key: 'ratings', site: 'trakt', suffix: '%' },
  { key: 'imdb_ratings', site: 'imdb', suffix: '', decimals: 1 },
  { key: 'tmdb_ratings', site: 'tmdb', suffix: '', decimals: 1 },
  { key: 'rt_meters', site: 'rt', suffix: '%' },
  { key: 'rt_user_meters', site: 'rt-audience', suffix: '%' },
  { key: 'letterboxd_ratings', site: 'letterboxd', suffix: '', decimals: 1 },
  { key: 'mal_ratings', site: 'mal', suffix: '', decimals: 1 },
];

const presetNames = { kids: 'Kids', teens: 'Teens' } as const;

const kept = (text: string): FilterTagValue => ({ text, without: false });

// A preset reads as its name ("Kids"), and a custom mix as each limited category ("Violence up to Mild").
function parentalValues(limits: ParentalLimits): FilterTagValue[] {
  const preset = parentalPreset(limits);
  if (preset === 'any') return [];
  if (preset) return [kept(presetNames[preset])];
  return parentalCategories.flatMap((category) => {
    const level = limits[category];
    return level === undefined ? [] : [kept(`${parentalCategoryLabels[category]} ${parentalLimitLabel(level)}`)];
  });
}

/** The sidebar's applied filters in OG's order, one tag each. Watch now's tag comes from `filterChips`. */
export function filterTags(filters: AdvancedFilters): FilterTag[] {
  const lists = listFilterKeys.flatMap((key) => {
    const { values, mode, excluded = [] } = filters[key];
    const tagValues = [
      ...values.map((value) => ({ text: filterValueLabel(key, value), without: mode === 'none' })),
      ...excluded.map((value) => ({ text: filterValueLabel(key, value), without: true })),
    ];
    return tagValues.length > 0 ? [{ id: key, values: tagValues }] : [];
  });
  const bounds = ranges.flatMap(({ key, site, suffix, decimals }) => {
    const range = filters[key];
    if (!range) return [];
    const [min, max] = range.map((value) => (decimals ? value.toFixed(decimals) : `${value}`));
    return [{ id: key, values: [kept(`${min} - ${max}${suffix}`)], ...(site && { site }) }];
  });
  const parental = parentalValues(filters.parental);

  const terms: FilterTag[] = filters.query ? [{ id: 'query', values: [kept(filters.query)] }] : [];
  return [...terms, ...lists, ...bounds, ...(parental.length > 0 ? [{ id: 'parental', values: parental }] : [])];
}
