import { dayIn } from '../utils/dayIn.ts';
import type { CalendarItem } from './calendarDays.ts';

/** The `YYYY-MM-DD` an item falls on: an air time in the viewer's zone, a release or streaming date as it is. */
export function calendarItemDay(item: CalendarItem, timeZone: string): string {
  const dated = item.type === 'movie' || item.streaming;
  return dated ? item.at.slice(0, 10) : dayIn(item.at, timeZone);
}
