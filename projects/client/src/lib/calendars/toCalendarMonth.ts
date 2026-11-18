import type { AdvancedFilters } from '../components/filters/advancedFilters.ts';
import { type CalendarDay, calendarDays, type CalendarItem } from './calendarDays.ts';
import type { HiddenCalendar } from './fetchHiddenCalendar.ts';
import { matchesCalendarFilters } from './matchesCalendarFilters.ts';
import { viewerAirTime } from './viewerAirTime.ts';
import { withoutHidden } from './withoutHidden.ts';

type ToCalendarMonthParams = {
  items: readonly CalendarItem[];
  /** The same month without filters, read when filters apply: what the sidebar's counts are out of. */
  unfilteredItems?: readonly CalendarItem[];
  hidden: HiddenCalendar;
  hideSpecials: boolean;
  filters: AdvancedFilters;
  dates: readonly string[];
  timeZone: string;
};

/** A month's days, and without filters the totals the sidebar counts out of. */
export type CalendarMonthData = {
  days: CalendarDay[];
  totals?: { episodes: number; movies: number };
};

/**
 * The month as the page shows it: what the viewer hid and (with the setting on) the specials left off, the terms and
 * episode types applied, every item on the viewer's own clock and sorted into the window's days.
 */
export function toCalendarMonth({
  items,
  unfilteredItems,
  hidden,
  hideSpecials,
  filters,
  dates,
  timeZone,
}: ToCalendarMonthParams): CalendarMonthData {
  const visible = (list: readonly CalendarItem[]) => withoutHidden(list, { hidden, hideSpecials });
  const toDays = (list: readonly CalendarItem[]) =>
    calendarDays({ dates, items: list.map((item) => viewerAirTime(item, timeZone)), timeZone });
  const unfiltered = unfilteredItems && toDays(visible(unfilteredItems));
  const count = (type: CalendarItem['type']) =>
    unfiltered?.flatMap((day) => day.items).filter((item) => item.type === type).length ?? 0;

  return {
    days: toDays(visible(items.filter((item) => matchesCalendarFilters(item, filters)))),
    ...(unfiltered && { totals: { episodes: count('episode'), movies: count('movie') } }),
  };
}
