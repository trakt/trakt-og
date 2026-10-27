import type { AdvancedFiltersConfig } from './AdvancedFiltersConfig.ts';
import type { ListFilterKey } from './advancedFilters.ts';
import { certificationOptions } from './certificationOptions.ts';
import { countryOptions } from './countryOptions.ts';
import { episodeTypeOptions } from './episodeTypeOptions.ts';
import { type FilterOption, statusOptions } from './filterOptions.ts';
import { genreOptions } from './genreOptions.ts';
import { languageOptions } from './languageOptions.ts';
import { mergeFilterOptions } from './mergeFilterOptions.ts';

/** The per-type lists og ships with, so the panel asks the API for none of them. */
const bundledOptions: Record<
  Exclude<ListFilterKey, 'networks' | 'status' | 'episode_types'>,
  Readonly<Record<'shows' | 'movies', readonly FilterOption[]>>
> = {
  genres: genreOptions,
  certifications: certificationOptions,
  languages: languageOptions,
  countries: countryOptions,
};

/**
 * A list filter's choices: statuses and episode types are fixed, and the other lists ship per media type, merged across
 * the page's media types (the mixed calendar offers both shows' and movies' genres). Networks are searched instead.
 */
export function listOptions(key: Exclude<ListFilterKey, 'networks'>, config: AdvancedFiltersConfig): FilterOption[] {
  if (key === 'status') return [...statusOptions];
  if (key === 'episode_types') return [...episodeTypeOptions];
  return mergeFilterOptions((config.optionTypes ?? [config.type]).map((type) => bundledOptions[key][type]));
}
