import { filterChips } from '../../components/filters/filterChips.ts';
import type { FilterTag, FilterTagValue } from '../../components/filters/filterTags.ts';
import { fromSmartListFilters } from './fromSmartListFilters.ts';
import type { SmartListFilters } from './SmartList.ts';

type Params = { filters: SmartListFilters; country: string };

const HIDE: Readonly<Record<string, string>> = {
  ignore_watched: 'Watched',
  ignore_watchlisted: 'Watchlisted',
  ignore_watching: 'Watching',
  ignore_unreleased: 'Unreleased',
  ignore_released: 'Released',
  ignore_ended: 'Ended',
  ignore_airing: 'Airing',
  ignore_no_release_date: 'No release date',
};
// Settings that shape another filter, not filters of their own.
const MODIFIERS = new Set([
  'genres_operator',
  'keywords_operator',
  'people_operator',
  'people_role',
  'watchnow_country',
  'parental_include_unrated',
]);

const words = (value: string) => value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

function valuesFor(key: string, value: unknown): FilterTagValue[] {
  if (MODIFIERS.has(key) || HIDE[key] || value === undefined) return [];
  if (typeof value === 'number') return [{ text: `Last ${value} days`, without: false }];
  if (!Array.isArray(value)) return [];
  if (value.every((item) => typeof item === 'number')) {
    return value.length > 0 ? [{ text: value.join(' - '), without: false }] : [];
  }
  return value.map((item: string) => {
    const without = item.startsWith('-');
    const name = without ? item.slice(1) : item;
    return { text: key === 'networks' ? name : words(name), without };
  });
}

/**
 * What a smart list is made of, as read-only filter chips. A list the chart panel can show reads like the chart's
 * Applied Filters; any other (keywords, studios, people, the hide switches) lists each filter it holds, with the
 * hide switches together on one chip.
 */
export function smartListRecipe({ filters, country }: Params): readonly FilterTag[] {
  const panel = fromSmartListFilters(filters);
  if (panel) return filterChips({ filters: panel, sources: new Map(), country, favorites: [] });

  const tags = Object.entries(filters).flatMap(([key, value]): FilterTag[] => {
    const values = valuesFor(key, value);
    return values.length > 0 ? [{ id: key, values }] : [];
  });
  const hidden = Object.entries(HIDE).flatMap(([key, text]) =>
    filters[key as keyof SmartListFilters] === true ? [{ text, without: false }] : [],
  );
  return [...tags, ...(hidden.length > 0 ? [{ id: 'hide', values: hidden }] : [])];
}
