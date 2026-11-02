import { parseAdvancedFilters } from '../../components/filters/advancedFilters.ts';
import { isSmartListChart } from './isSmartListChart.ts';
import { smartListChartHref } from './smartListChartHref.ts';
import type { SmartListWrite } from './SmartList.ts';
import { smartListFilterKeys } from './smartListFilterKeys.ts';
import { toSmartListFilters } from './toSmartListFilters.ts';

type SavedFilter = { readonly name: string; readonly path: string; readonly query: string };

// The chart query params a smart list keeps, and the ones that only page or sort it.
const KEPT = new Set([
  ...Object.keys(smartListFilterKeys.lists),
  ...Object.keys(smartListFilterKeys.ranges),
  'watchnow',
]);
const PAGING = new Set(['page', 'limit']);

/**
 * A classic Trakt saved filter as the smart list it becomes, or null when it can't be one: a calendar or search
 * filter, a chart that isn't a smart list source, or a filter og's chart reads differently (OG's `network_ids`, the
 * terms search). It comes back private, like the sidebar link it was.
 */
export function fromSavedFilter({ name, path, query }: SavedFilter, now: Date): SmartListWrite | null {
  const [, type, chart] = /^\/(shows|movies)\/([a-z]+)\/?$/.exec(path) ?? [];
  if ((type !== 'shows' && type !== 'movies') || !chart || !isSmartListChart(chart)) return null;

  const search = new URLSearchParams(query.replace(/^\?/, ''));
  const unknown = [...search].some(([key, value]) => value.trim() !== '' && !KEPT.has(key) && !PAGING.has(key));
  if (unknown) return null;

  const filters = toSmartListFilters(parseAdvancedFilters(search));
  if (!smartListChartHref({ list: { slug: '', source: chart, mediaType: type, filters }, now })) return null;
  return { name: name.trim() || 'Saved filter', privacy: 'private', source: chart, mediaType: type, filters };
}
