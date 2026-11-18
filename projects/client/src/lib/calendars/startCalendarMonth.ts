import { cachedOnActivity } from '../activity/cachedOnActivity.ts';
import type { ReadLastActivities } from '../activity/createLastActivities.ts';
import { api } from '../api/api.ts';
import { recentReads } from '../api/recentReads.ts';
import { hasAdvancedFilters } from '../components/filters/advancedFilters.ts';
import type { AdvancedFilters } from '../components/filters/advancedFilters.ts';
import { advancedFiltersQuery } from '../components/filters/advancedFiltersQuery.ts';
import { calendarKey, calendarShape } from './calendarKey.ts';
import type { CalendarItem } from './calendarDays.ts';
import { calendarRanges } from './calendarRanges.ts';
import type { CalendarWindow } from './calendarWindow.ts';
import { fetchCalendar } from './fetchCalendar.ts';
import { fetchHiddenCalendar } from './fetchHiddenCalendar.ts';
import type { MyCalendar } from './myCalendars.ts';
import { type CalendarMonthData, toCalendarMonth } from './toCalendarMonth.ts';
import { dayIn } from '../utils/dayIn.ts';

const HOUR_MS = 60 * 60 * 1000;
// The day is in the key, so this only bounds a copy nobody has opened for a while.
const MAX_AGE_MS = 24 * HOUR_MS;

type Params = {
  /** The browser's signed-in fetch. */
  fetch: typeof fetch;
  /** The viewer's slug, so a saved month is only ever shown to its owner. */
  user: string;
  slug: MyCalendar['slug'];
  window: Pick<CalendarWindow, 'start' | 'dates' | 'request'>;
  filters: AdvancedFilters;
  timeZone: string;
  hideSpecials: boolean;
  activities: ReadLastActivities;
  /** A saved month shows at once; when your activity has moved since, its fresh read arrives here. */
  onUpdate: (month: CalendarMonthData) => void;
  now?: Date;
  memory?: Pick<typeof recentReads, 'read'>;
};

/**
 * Reads the viewer's month from the browser with their own token: the calendar's entries, the unfiltered totals when
 * filters apply, and the hidden list. This month, the one a calendar opens on, is kept between visits and shown at once,
 * then checked against `last_activities`. Any other month stays in memory for a few minutes (`recentReads`), so paging
 * back and forth reads it once, and any write lets go of it. A failed read rejects, so the page shows its failure state.
 */
export function startCalendarMonth({
  fetch,
  user,
  slug,
  window,
  filters,
  timeZone,
  hideSpecials,
  activities,
  onUpdate,
  now = new Date(),
  memory = recentReads,
}: Params): Promise<CalendarMonthData> {
  const query = advancedFiltersQuery(filters);
  const client = api({ fetch }).calendars;
  const ranges = calendarRanges(window.request.start_date, window.request.days);

  const readItems = async (filterQuery: Readonly<Record<string, string>>) => {
    const lists = await Promise.all(
      ranges.map((range) => fetchCalendar({ client, target: 'my', slug, range, filters: filterQuery })),
    );
    return lists.flatMap((items) => {
      if (items === 'signed-out') throw new Error('Your sign-in expired.');
      return items satisfies CalendarItem[];
    });
  };

  const shape = calendarShape({ slug, start: window.start, query, timeZone, hideSpecials });
  const read = async () => {
    const [items, unfilteredItems, hidden] = await Promise.all([
      readItems(query),
      hasAdvancedFilters(filters) ? readItems({}) : undefined,
      fetchHiddenCalendar({ fetch, token: null }),
    ]);
    return toCalendarMonth({ items, unfilteredItems, hidden, hideSpecials, filters, dates: window.dates, timeZone });
  };

  if (!window.dates.includes(dayIn(now, timeZone)))
    return memory.read(`calendar:${user}:${JSON.stringify(shape)}`, read);

  return cachedOnActivity({
    name: `calendar-${slug}`,
    activities,
    user,
    key: (latest) => calendarKey({ activities: latest, slug, start: window.start, query, timeZone, hideSpecials, now }),
    maxAgeMs: MAX_AGE_MS,
    accepts: (saved) => {
      try {
        return JSON.stringify(JSON.parse(saved)[1]) === JSON.stringify(shape);
      } catch {
        return false;
      }
    },
    onUpdate,
    read,
  });
}
