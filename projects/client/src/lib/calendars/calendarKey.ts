import type { LastActivitiesResponse } from '@trakt/api';
import { dayIn } from '../utils/dayIn.ts';

type CalendarKeyParams = {
  activities: LastActivitiesResponse;
  slug: string;
  /** The month's first day, as the window gives it. */
  start: string;
  /** The advanced filters' API query: rating and watch state filters move with your own activity. */
  query: Readonly<Record<string, string>>;
  timeZone: string;
  hideSpecials: boolean;
  now: Date;
};

/** The inputs that shape the saved days. A saved month with other ones is never shown, so it can't pass for this one. */
export const calendarShape = ({
  slug,
  start,
  query,
  timeZone,
  hideSpecials,
}: Pick<CalendarKeyParams, 'slug' | 'start' | 'query' | 'timeZone' | 'hideSpecials'>) => [
  slug,
  start,
  query,
  timeZone,
  hideSpecials,
];

/**
 * What moves a saved month, for `cachedOnActivity`. A My calendar is built from what you watch, collect and
 * watchlist, minus what you hid or dropped, so those stamps move it. Ratings only matter when a filter reads them. The
 * day rolls it over too, since air dates and releases change without any activity of yours.
 */
export const calendarKey = ({ activities, now, ...shape }: CalendarKeyParams) => [
  [
    activities.movies?.watched_at,
    activities.movies?.collected_at,
    activities.movies?.watchlisted_at,
    activities.movies?.hidden_at,
    activities.episodes?.watched_at,
    activities.episodes?.collected_at,
    activities.shows?.watchlisted_at,
    activities.shows?.hidden_at,
    activities.shows?.dropped_at,
    Object.keys(shape.query).length > 0 ? [activities.movies?.rated_at, activities.shows?.rated_at] : null,
  ],
  calendarShape(shape),
  dayIn(now, shape.timeZone),
];
