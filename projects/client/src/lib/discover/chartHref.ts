import type { ThemeFilter } from './discoverThemes.ts';

/**
 * The chart a shelf's "View more" opens (trending unless another is named), with what of its filters the chart pages read from the URL: the
 * included genres (the chart's genres take one mode for the whole list, so the excluded ones are dropped), and the
 * runtime and rating ranges. Subgenres have no chart filter, so a subgenre theme opens its genre's chart, or the
 * plain one.
 */
export function chartHref(type: 'movie' | 'show', filter: ThemeFilter, chart = 'trending'): string {
  const genres = (filter.genres?.split(',') ?? []).filter((genre) => genre && !genre.startsWith('-'));
  const params = new URLSearchParams({
    ...(genres.length > 0 && { genres: genres.join(',') }),
    ...(filter.runtimes && { runtimes: filter.runtimes }),
    ...(filter.ratings && { ratings: filter.ratings }),
  });
  const query = params.toString();
  return `/${type}s/${chart}${query ? `?${query}` : ''}`;
}
