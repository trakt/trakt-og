import { calendarRanges } from '../calendars/calendarRanges.ts';
import { addDays } from '../utils/addDays.ts';

/** OG looked a year ahead, or 40 days with the "All my TV shows" filter. */
const LOOKAHEAD = 365;

/**
 * The calendar requests that cover OG's `lookahead` days from `start`, one worker-sized window each. They begin a UTC
 * day early, because a viewer east of UTC sees tonight's episodes on the calendar's previous UTC day.
 */
export function scheduleRanges(start: string, lookahead = LOOKAHEAD): { start_date: string; days: number }[] {
  return calendarRanges(addDays(start, -1), lookahead + 2);
}
