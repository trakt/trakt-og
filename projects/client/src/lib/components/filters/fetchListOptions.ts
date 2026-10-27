import type { AdvancedFiltersConfig } from './AdvancedFiltersConfig.ts';
import type { ListFilterKey } from './advancedFilters.ts';
import { certificationOptions } from './certificationOptions.ts';
import { countryOptions } from './countryOptions.ts';
import { episodeTypeOptions } from './episodeTypeOptions.ts';
import { fetchFilterBody } from './fetchFilterBody.ts';
import {
  type FetchedFilterKey,
  type FilterOption,
  optionMappers,
  optionPaths,
  statusOptions,
} from './filterOptions.ts';
import { genreOptions } from './genreOptions.ts';
import { languageOptions } from './languageOptions.ts';
import { mergeFilterOptions } from './mergeFilterOptions.ts';

/** The per-type lists og ships with, so the panel asks the API for none of them. */
const bundledOptions: Record<
  Exclude<ListFilterKey, FetchedFilterKey | 'status' | 'episode_types'>,
  Readonly<Record<'shows' | 'movies', readonly FilterOption[]>>
> = {
  genres: genreOptions,
  certifications: certificationOptions,
  languages: languageOptions,
  countries: countryOptions,
};

const isFetched = (key: ListFilterKey): key is FetchedFilterKey => Object.hasOwn(optionPaths, key);

/**
 * A list filter's choices: statuses and episode types are fixed, and the other lists ship per media type, merged across
 * the page's media types (the mixed calendar offers both shows' and movies' genres). Only networks come from the API.
 */
export function fetchListOptions(key: ListFilterKey, config: AdvancedFiltersConfig): Promise<FilterOption[]> {
  if (key === 'status') return Promise.resolve([...statusOptions]);
  if (key === 'episode_types') return Promise.resolve([...episodeTypeOptions]);
  const types = config.optionTypes ?? [config.type];
  if (!isFetched(key)) return Promise.resolve(mergeFilterOptions(types.map((type) => bundledOptions[key][type])));
  return Promise.all(types.map((type) => fetchFilterBody(optionPaths[key](type)).then(optionMappers[key]))).then(
    mergeFilterOptions,
  );
}
