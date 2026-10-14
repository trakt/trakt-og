import { dayIn } from '../calendars/calendarDays.ts';

export type RecapWindow = {
  /** 1 to 12. */
  readonly month: number;
  /** UTC instants for the history query: the month's first midnight in the viewer's zone, to the next one or now. */
  readonly start: string;
  readonly end: string;
};

type RecapWindowsParams = { now: Date; timeZone: string };

/** How far `timeZone`'s wall clock runs ahead of UTC at `at`, in milliseconds. */
function offsetAt(at: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(at).map(({ type, value }) => [type, Number(value)]),
  );
  const wall = Date.UTC(parts.year ?? 0, (parts.month ?? 1) - 1, parts.day, parts.hour, parts.minute, parts.second);
  return wall - Math.floor(at / 1000) * 1000;
}

/** Midnight on the 1st of `month` in `timeZone`, checked again at the result so a DST change that day lands right. */
function monthStart(year: number, month: number, timeZone: string) {
  const wall = Date.UTC(year, month - 1, 1);
  const guess = wall - offsetAt(wall, timeZone);
  return wall - offsetAt(guess, timeZone);
}

/**
 * This year's months up to today in the viewer's zone, each as a history window: whole months for those gone by, and
 * the current one up to `now`. In January, when the new year has barely started, it's last year's twelve whole months
 * instead, as OG's dashboard opened last year's Year in Review in January.
 */
export function recapWindows({ now, timeZone }: RecapWindowsParams): readonly RecapWindow[] {
  const [thisYear = 0, thisMonth = 1] = dayIn(now.toISOString(), timeZone).split('-').map(Number);
  const reviewing = thisMonth === 1;
  const year = reviewing ? thisYear - 1 : thisYear;
  const current = reviewing ? 12 : thisMonth;

  return Array.from({ length: current }, (_, index) => {
    const month = index + 1;
    const end = month === current && !reviewing ? now.getTime() : monthStart(year, month + 1, timeZone);
    return {
      month,
      start: new Date(monthStart(year, month, timeZone)).toISOString(),
      end: new Date(end).toISOString(),
    };
  });
}
