import type { DatePreferences } from '../settings/DatePreferences.ts';
import { airTime } from './airTime.ts';
import type { CalendarItem } from './calendarDays.ts';

/** An episode's air time ("9:00 pm"), or "Streaming" for a streaming day, which has no time. */
export function calendarItemTime(item: CalendarItem, clock: Pick<DatePreferences, 'timeZone' | 'hour24'>): string {
  return item.type === 'episode' && item.streaming ? 'Streaming' : airTime(item.at, clock);
}
