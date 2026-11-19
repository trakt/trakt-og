import { dayIn } from '../utils/dayIn.ts';
import { fromWallClock } from '../utils/fromWallClock.ts';

export type SocialPeriod = 'today' | 'yesterday' | 'week';
/** Hot in Your Network's periods: the feed's, and a month. */
export type SocialSpan = SocialPeriod | 'month';

/** One request's range: the worker serves at most 24 hours at a time. */
export type SocialWindow = { readonly start: string; readonly end: string };

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
const DAYS: Readonly<Record<Exclude<SocialSpan, 'yesterday'>, number>> = { today: 1, week: 7, month: 30 };

/** The instant `day` (`YYYY-MM-DD`) starts in `timeZone`. */
const midnight = (day: string, timeZone: string) => fromWallClock(Date.parse(`${day}T00:00:00Z`), timeZone);

const iso = (at: number) => new Date(at).toISOString();

/**
 * The windows a period asks the feed for, newest first. Today is the last 24 hours, and the week seven of them back to
 * back as v3's Today page counts them, the month thirty; yesterday is the viewer's calendar day, cut to 24 hours on a DST day. Ends
 * round down to the minute, so one page load asks for the same windows and the worker's cache can answer.
 */
export function socialWindows(period: SocialSpan, now: Date, timeZone: string): readonly SocialWindow[] {
  const end = Math.floor(now.getTime() / MINUTE_MS) * MINUTE_MS;

  if (period === 'yesterday') {
    const today = midnight(dayIn(now.toISOString(), timeZone), timeZone);
    const start = midnight(dayIn(iso(today - DAY_MS / 2), timeZone), timeZone);
    return [{ start: iso(start), end: iso(Math.min(today, start + DAY_MS)) }];
  }

  return Array.from({ length: DAYS[period] }, (_, day) => ({
    start: iso(end - (day + 1) * DAY_MS),
    end: iso(end - day * DAY_MS),
  }));
}
