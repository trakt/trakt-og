import { advancedFiltersSearch, parseAdvancedFilters } from '../components/filters/advancedFilters.ts';
import type { ThemeFilter } from './discoverThemes.ts';

/**
 * The chart a shelf's "View more" opens (trending unless another is named), with the shelf's genres, runtimes and
 * ratings in the URL the chart's own filter panel writes. Subgenres have no chart filter, so a subgenre theme opens
 * its genre's chart, or the plain one.
 */
export function chartHref(type: 'movie' | 'show', filter: ThemeFilter, chart = 'trending'): string {
  const { genres, runtimes, ratings } = filter;
  const params = new URLSearchParams({
    ...(genres && { genres }),
    ...(runtimes && { runtimes }),
    ...(ratings && { ratings }),
  });
  const query = advancedFiltersSearch(parseAdvancedFilters(params));
  return `/${type}s/${chart}${query ? `?${query}` : ''}`;
}
