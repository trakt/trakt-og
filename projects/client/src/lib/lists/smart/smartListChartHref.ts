import { chartFilters } from '../../charts/chartFilters.ts';
import { advancedFiltersSearch } from '../../components/filters/advancedFilters.ts';
import { fromFilterDraft, toFilterDraft } from '../../components/filters/filterDraft.ts';
import { fromSmartListFilters } from './fromSmartListFilters.ts';
import { isSmartListChart } from './isSmartListChart.ts';
import { SMART_LIST_PARAM } from './SMART_LIST_PARAM.ts';
import type { SmartList } from './SmartList.ts';
import { toSmartListFilters } from './toSmartListFilters.ts';

type Params = { list: Pick<SmartList, 'slug' | 'source' | 'mediaType' | 'filters'>; now: Date };

/**
 * The chart that shows a smart list, with its filters applied and its slug along, or null when no chart can: a
 * source og has no chart for, both media types, or a filter that chart's panel doesn't have.
 */
export function smartListChartHref({ list, now }: Params): string | null {
  const { source, mediaType } = list;
  if (!isSmartListChart(source) || mediaType === 'media') return null;
  const filters = fromSmartListFilters(list.filters);
  if (!filters) return null;

  const config = chartFilters({ type: mediaType, chart: source, period: 'weekly', now });
  const shown = fromFilterDraft(toFilterDraft(filters, config), config);
  if (JSON.stringify(toSmartListFilters(shown)) !== JSON.stringify(toSmartListFilters(filters))) return null;

  const query = advancedFiltersSearch(shown);
  return `/${mediaType}/${source}?${query ? `${query}&` : ''}${SMART_LIST_PARAM}=${encodeURIComponent(list.slug)}`;
}
