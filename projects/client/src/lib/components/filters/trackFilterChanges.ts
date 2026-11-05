import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import type { AdvancedFilters } from './advancedFilters.ts';
import { filterChanges } from './filterChanges.ts';

const { track } = useTrack(AnalyticsEvent.Filter);

/** trakt-web's `action.filter` for each filter a change sets or clears. og's panel is web's advanced mode. */
export function trackFilterChanges(before: AdvancedFilters, after: AdvancedFilters): void {
  filterChanges(before, after).forEach(({ id, action }) => track({ id, action, mode: 'advanced' }));
}
