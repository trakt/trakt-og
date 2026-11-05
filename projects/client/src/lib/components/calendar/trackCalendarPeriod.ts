import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';

const { track } = useTrack(AnalyticsEvent.CalendarPeriod);

/** trakt-web's `calendar-action.period`: a step back (`prev`) or forward, or back to today. */
export function trackCalendarPeriod(step: 'prev' | 'next' | 'reset') {
  track({ action: step === 'prev' ? 'previous' : step });
}
