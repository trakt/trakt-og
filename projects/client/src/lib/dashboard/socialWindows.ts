import { dayIn } from '../utils/dayIn.ts';

export type SocialPeriod = 'today' | 'yesterday' | 'week';

/** One request's range: the worker serves at most 24 hours at a time. */
export type SocialWindow = { readonly start: string; readonly end: string };

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;
const WEEK_DAYS = 7;

/** How far `timeZone`'s wall clock is ahead of UTC at `at`, in ms. */
function offsetAt(at: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'));
  return wall - Math.floor(at / 1000) * 1000;
}

/** The instant `day` (`YYYY-MM-DD`) starts in `timeZone`. A second pass settles a DST change between the guesses. */
function midnight(day: string, timeZone: string): number {
  const utc = Date.parse(`${day}T00:00:00Z`);
  const guess = utc - offsetAt(utc, timeZone);
  return utc - offsetAt(guess, timeZone);
}

const iso = (at: number) => new Date(at).toISOString();

/**
 * The windows a period asks the feed for, newest first. Today is the last 24 hours and the week seven of them back to
 * back, as v3's Today page counts them; yesterday is the viewer's calendar day, cut to 24 hours on a DST day. Ends
 * round down to the minute, so one page load asks for the same windows and the worker's cache can answer.
 */
export function socialWindows(period: SocialPeriod, now: Date, timeZone: string): readonly SocialWindow[] {
  const end = Math.floor(now.getTime() / MINUTE_MS) * MINUTE_MS;

  if (period === 'yesterday') {
    const today = midnight(dayIn(now.toISOString(), timeZone), timeZone);
    const start = midnight(dayIn(iso(today - DAY_MS / 2), timeZone), timeZone);
    return [{ start: iso(start), end: iso(Math.min(today, start + DAY_MS)) }];
  }

  const days = period === 'week' ? WEEK_DAYS : 1;
  return Array.from({ length: days }, (_, day) => ({
    start: iso(end - (day + 1) * DAY_MS),
    end: iso(end - day * DAY_MS),
  }));
}
