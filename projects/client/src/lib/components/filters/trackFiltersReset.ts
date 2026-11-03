import { AnalyticsEvent } from '$lib/analytics/AnalyticsEvent';
import { useTrack } from '$lib/analytics/useTrack';

const { track } = useTrack(AnalyticsEvent.Filters);

/** trakt-web's `action.filters` reset: every filter cleared at once, counted once rather than per filter. */
export function trackFiltersReset(): void {
  track({ action: 'reset' });
}
