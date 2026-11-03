import { AnalyticsEvent } from '$lib/analytics/AnalyticsEvent';
import { useTrack } from '$lib/analytics/useTrack';

const { track: trackTrailerEvent } = useTrack(AnalyticsEvent.Trailer);
const { track: trackExtrasEvent } = useTrack(AnalyticsEvent.Extras);

/** The movie or show slug in an item's path: a season's or an episode's is its show's, like web's videos. */
export function mediaSlug(href: string): string {
  return new URL(href, 'https://og.trakt.tv').pathname.split('/')[2] ?? '';
}

/** Web's `media-action.trailer`: a hero's Trailer button played the item's trailer. */
export function trackTrailer(href: string): void {
  trackTrailerEvent({ slug: mediaSlug(href) });
}

/** Web's `media-action.extras`: a video from an item's list of videos was opened. */
export function trackExtras(href: string, type: string): void {
  trackExtrasEvent({ slug: mediaSlug(href), type });
}
