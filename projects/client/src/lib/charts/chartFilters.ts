import type { AdvancedFiltersConfig } from '../components/filters/AdvancedFiltersConfig.ts';
import type { ListFilterKey, RangeFilterKey } from '../components/filters/advancedFilters.ts';
import { filterRanges } from '../components/filters/filterRanges.ts';
import type { ChartName } from './chartNames.ts';
import { isPeriodChart } from './chartNames.ts';
import type { ChartPeriod } from './chartPeriod.ts';
import type { MediaType } from './loadChart.ts';

/** OG's period options labels. */
const periodOptions = [
  { value: 'daily', label: 'Last Day' },
  { value: 'weekly', label: 'Last 7 Days' },
  { value: 'monthly', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time' },
];

type ChartFiltersParams = { type: MediaType; chart: ChartName; period: ChartPeriod; now: Date };

/**
 * The advanced filter panel for one chart. Filter Terms, Studios, Metacritic and the vote sliders are cut. Letterboxd
 * only rates movies. Recommendations take the same filters as the other charts, though OG offered only a few: the API
 * narrows the viewer's top picks with them, so a narrow mix can come back short.
 */
export function chartFilters({ type, chart, period, now }: ChartFiltersParams): AdvancedFiltersConfig {
  const scales = filterRanges({ now, upcoming: chart === 'anticipated' });
  const base = {
    type,
    watchnow: true,
    scales,
    ...(isPeriodChart(chart) && { period: { value: period, options: periodOptions } }),
  };
  const lists: ListFilterKey[] =
    type === 'shows'
      ? ['genres', 'certifications', 'languages', 'countries', 'networks', 'status']
      : ['genres', 'certifications', 'languages', 'countries'];
  const ranges: RangeFilterKey[] = [
    'years',
    'runtimes',
    'ratings',
    'imdb_ratings',
    'tmdb_ratings',
    'rt_meters',
    'rt_user_meters',
    ...(type === 'movies' ? (['letterboxd_ratings'] as const) : []),
    'mal_ratings',
  ];
  return { ...base, lists, ranges, parental: true };
}
