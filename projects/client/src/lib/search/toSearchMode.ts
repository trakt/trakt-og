import type { AnalyticsEvent } from '../analytics/AnalyticsEvent.ts';
import type { AnalyticsEventDataMap } from '../analytics/AnalyticsEventDataMap.ts';
import type { SearchType } from './SearchType.ts';

export type SearchMode = AnalyticsEventDataMap[typeof AnalyticsEvent.Search]['mode'];

// trakt-web has no ID lookup mode, so a Trakt, IMDB, TMDB or TVDB ID search counts as its mixed search.
const SEARCH_MODES: Readonly<Record<SearchType['slug'], SearchMode>> = {
  '': 'media',
  shows: 'show',
  movies: 'movie',
  people: 'people',
  lists: 'lists',
  trakt: 'media',
  imdb: 'media',
  tmdb: 'media',
  tvdb: 'media',
};

/** trakt-web's `action.search` mode for a search tab. */
export const toSearchMode = (slug: SearchType['slug']): SearchMode => SEARCH_MODES[slug];
