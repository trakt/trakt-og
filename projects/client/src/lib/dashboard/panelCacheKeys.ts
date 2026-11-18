import type { LastActivitiesResponse } from '@trakt/api';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { dayIn } from '../utils/dayIn.ts';
import type { DashboardSettings } from './DashboardSettings.ts';

/**
 * What moves a panel's saved read, for `cachedOnActivity`. Each lists the activity stamps its data depends on, plus
 * every input that shapes the saved value (settings, and the date preferences its dates are formatted with), so a
 * change to either reads again.
 */

const watched = ({ movies, episodes, shows }: LastActivitiesResponse) => [
  movies?.watched_at,
  episodes?.watched_at,
  shows?.hidden_at,
  shows?.dropped_at,
];

export const upNextKey = (activities: LastActivitiesResponse, settings: DashboardSettings['upNext']) => [
  ...watched(activities),
  settings,
];

export const recentlyWatchedKey = (activities: LastActivitiesResponse, datePreferences: DatePreferences) => [
  ...watched(activities),
  datePreferences,
];

/** Last 30 Days and the recap ribbon also roll over with the day, in the viewer's zone. */
export const dailyKey = (activities: LastActivitiesResponse, datePreferences: DatePreferences, now: Date) => [
  ...watched(activities),
  dayIn(now, datePreferences.timeZone),
  datePreferences,
];

export const watchlistKey = (activities: LastActivitiesResponse, datePreferences: DatePreferences) => [
  activities.watchlist?.updated_at,
  datePreferences,
];
