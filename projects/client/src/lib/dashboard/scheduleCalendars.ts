import type { MyCalendar } from '../calendars/myCalendars.ts';
import type { DashboardSettings } from './DashboardSettings.ts';

/**
 * The "My" calendars the Upcoming Schedule reads for its Shows and Movies picks (OG's `calendar_episodes` and
 * `calendar_movies`): all of both is the one Shows & Movies calendar, otherwise the shows' calendar and the movies'
 * side by side. None of either reads nothing. The first is the one the Calendar link opens.
 */
export function scheduleCalendars({
  filter,
  movies,
}: Pick<DashboardSettings['schedule'], 'filter' | 'movies'>): MyCalendar['slug'][] {
  const allShows = filter === 'shows-movies' || filter === 'shows';
  if (allShows && movies === 'all') return ['shows-movies'];

  const shows = filter === 'none' ? [] : [allShows ? ('shows' as const) : filter];
  return [...shows, ...(movies === 'all' ? ['movies' as const] : [])];
}
