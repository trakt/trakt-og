import type { CalendarMovieResponse, CalendarShowResponse, HotReleaseResponse } from '@trakt/api';
import { earlyStreamDate } from '../shows/earlyStreamDate.ts';
import type { CalendarItem } from './calendarDays.ts';

type CalendarEntry = CalendarShowResponse | CalendarMovieResponse | HotReleaseResponse;

/**
 * Calendar rows as calendar items. The show and movie calendars return one shape each; the merged hot releases
 * feed returns both in one flat row with every field nullish, told apart by which ones are set.
 */
export function toCalendarItems(entries: readonly CalendarEntry[]): CalendarItem[] {
  return entries.flatMap((entry): CalendarItem[] => {
    if ('movie' in entry && entry.movie && entry.released) {
      return [{ type: 'movie', at: entry.released, movie: entry.movie }];
    }
    if ('episode' in entry && entry.episode && entry.show && entry.first_aired) {
      const streams = earlyStreamDate({ ...entry.episode, first_aired: entry.first_aired });
      return [
        {
          type: 'episode',
          at: streams ?? entry.first_aired,
          ...(streams && { streaming: true, airsAt: entry.first_aired }),
          show: entry.show,
          episode: entry.episode,
        },
      ];
    }
    return [];
  });
}
