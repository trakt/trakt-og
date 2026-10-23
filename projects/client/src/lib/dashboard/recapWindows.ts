import { dayIn } from '../utils/dayIn.ts';
import { fromWallClock } from '../utils/fromWallClock.ts';

export type RecapWindow = {
  /** 1 to 12. */
  readonly month: number;
  /** UTC instants for the history query: the month's first midnight in the viewer's zone, to the next one or now. */
  readonly start: string;
  readonly end: string;
};

type RecapWindowsParams = { now: Date; timeZone: string };

/** Midnight on the 1st of `month` in `timeZone`. */
const monthStart = (year: number, month: number, timeZone: string) =>
  fromWallClock(Date.UTC(year, month - 1, 1), timeZone);

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
