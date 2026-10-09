import type { AdvancedFiltersConfig } from './AdvancedFiltersConfig.ts';
import type { ListFilterKey } from './advancedFilters.ts';
import { episodeTypeOptions } from './episodeTypeOptions.ts';
import { fetchFilterBody } from './fetchFilterBody.ts';
import { type FilterOption, optionMappers, optionPaths, statusOptions } from './filterOptions.ts';
import { mergeFilterOptions } from './mergeFilterOptions.ts';

/**
 * A list filter's choices: statuses and episode types are fixed, the rest come from the API, merged across the
 * page's media types (the mixed calendar offers both shows' and movies' genres).
 */
export function fetchListOptions(key: ListFilterKey, config: AdvancedFiltersConfig): Promise<FilterOption[]> {
  if (key === 'status') return Promise.resolve([...statusOptions]);
  if (key === 'episode_types') return Promise.resolve([...episodeTypeOptions]);
  return Promise.all(
    (config.optionTypes ?? [config.type]).map((type) =>
      fetchFilterBody(optionPaths[key](type)).then(optionMappers[key])
    ),
  ).then(mergeFilterOptions);
}
