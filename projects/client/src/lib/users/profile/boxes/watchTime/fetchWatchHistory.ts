import { rawApiFetch } from '../../../../api/rawApiFetch.ts';
import type { boxExtraLoader } from '../boxExtraLoader.ts';

const DAY = 86_400_000;

/** One bar of the All Time chart: a span of UTC days, start and end inclusive, and its name in the tooltip. */
export type HistorySpan = { readonly start: number; readonly end: number; readonly label: string };

const month = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const monthName = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
/** "Apr - Jun 2025": a quarter by its months. */
const quarter = (start: Date) =>
  `${monthName(start)} - ${monthName(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 2, 1)))} ${start.getUTCFullYear()}`;
const dayName = (day: number) =>
  new Date(day * DAY).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const utcDay = (date: Date) => Math.floor(date.getTime() / DAY);

/** Calendar spans of `months` months from the one holding `from`, through `today`. */
function calendar(from: number, today: number, months: number, label: (start: Date) => string): HistorySpan[] {
  const first = new Date(from * DAY);
  const spans: HistorySpan[] = [];
  let at = Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - (first.getUTCMonth() % months), 1);
  while (utcDay(new Date(at)) <= today) {
    const start = new Date(at);
    const next = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1);
    spans.push({ start: utcDay(start), end: Math.min(utcDay(new Date(next)) - 1, today), label: label(start) });
    at = next;
  }
  return spans;
}

/**
 * The All Time chart's bars, by how long the member has been on Trakt: a bar a week for their first three months, a
 * month under two years, a quarter under six, then a year. Without a join date, the last twelve months.
 */
export function historySpans(joinedAt: string | null, today: number): HistorySpan[] {
  const joined = joinedAt ? utcDay(new Date(joinedAt)) : today - 334;
  const age = today - joined;
  if (age < 90) {
    return Array.from({ length: Math.floor(age / 7) + 1 }, (_, i) => {
      const start = joined + i * 7;
      const end = Math.min(start + 6, today);
      return { start, end, label: `${dayName(start)} to ${dayName(end)}` };
    });
  }
  if (age < 730) return calendar(joined, today, 1, month);
  if (age < 2190) {
    return calendar(joined, today, 3, quarter);
  }
  return calendar(joined, today, 12, (start) => String(start.getUTCFullYear()));
}

/**
 * Plays in each of the All Time chart's spans: `/users/:id/history` for the span with one row, which only needs the
 * count the response heads. A span that fails is `null`.
 */
export async function fetchWatchHistory({ fetch, token, id, joinedAt, today }: Parameters<typeof boxExtraLoader>[0]) {
  return Promise.all(
    historySpans(joinedAt, today).map(async (span) => {
      const query = new URLSearchParams({
        start_at: new Date(span.start * DAY).toISOString(),
        end_at: new Date((span.end + 1) * DAY - 1).toISOString(),
        limit: '1',
      });
      const response = await rawApiFetch({
        fetch,
        token,
        path: `/users/${encodeURIComponent(id)}/history?${query}`,
      }).catch(() => null);
      const count = Number(response?.ok ? response.headers.get('x-pagination-item-count') : Number.NaN);
      return { ...span, plays: Number.isFinite(count) ? count : null };
    }),
  );
}
