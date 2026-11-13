import type { AirsTip } from '../components/media/AirsTip.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { airDateParts } from '../shows/airDateParts.ts';
import { airsTip } from '../shows/airsTip.ts';
import type { CalendarItem } from './calendarDays.ts';

/** A streaming item's Streaming tag tooltip: its broadcast on the viewer's clock. Undefined for anything else. */
export function calendarItemAirsTip(
  item: CalendarItem,
  clock: Pick<DatePreferences, 'timeZone' | 'hour24'> & Partial<Pick<DatePreferences, 'order'>>,
  now: Date,
): AirsTip | undefined {
  if (item.type !== 'episode' || !item.streaming) return undefined;
  return airsTip(item.airsAt, {
    network: item.show.network,
    now,
    parts: (at) => airDateParts(at, { ...clock, format: 'LL' }),
  });
}
