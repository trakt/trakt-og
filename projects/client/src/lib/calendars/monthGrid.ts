const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const toIso = (date: Date) => date.toISOString().slice(0, 10);

function addDays(iso: string, days: number) {
  const date = toDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** One square of a month grid. */
export type MonthCell = { readonly date: string; readonly inMonth: boolean };

/**
 * A month as whole weeks: the month's days, padded at both ends with the neighbouring months' days so every week
 * starts on `weekStart` (0 is Sunday) and has seven of them.
 */
export function monthGrid({ month, weekStart = 0 }: { month: string; weekStart?: number }): MonthCell[][] {
  const first = `${month.slice(0, 7)}-01`;
  const next = toDate(first);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const last = addDays(toIso(next), -1);
  const start = addDays(first, -((toDate(first).getUTCDay() - weekStart + 7) % 7));
  const end = addDays(last, (weekStart + 6 - toDate(last).getUTCDay() + 7) % 7);
  const count = Math.round((toDate(end).getTime() - toDate(start).getTime()) / 86_400_000) + 1;
  const cells = Array.from({ length: count }, (_, i) => {
    const date = addDays(start, i);
    return { date, inMonth: date.slice(0, 7) === first.slice(0, 7) };
  });
  return Array.from({ length: count / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}
