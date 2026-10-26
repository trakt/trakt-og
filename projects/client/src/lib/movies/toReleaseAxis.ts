const DAY = 86_400_000;
/** Room either side of the first and last release, as a share of the span. */
const PAD = 0.04;
/** Past about a year and a half, the axis ticks years instead of months. */
const YEARLY_AFTER = 540 * DAY;
const MAX_TICKS = 12;
/** A month at least, so one release or a cluster isn't stretched across the row. */
const MIN_SPAN = 30 * DAY;

const monthName = (time: number, year: boolean) =>
  new Date(time).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', ...(year ? { year: 'numeric' } : {}) });

function monthTicks(start: number, end: number) {
  const from = new Date(start);
  const months = Array.from({ length: 24 }, (_, i) => Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i + 1, 1));
  return months
    .filter((time) => time < end)
    .map((time, i) => ({ time, label: monthName(time, i === 0 || new Date(time).getUTCMonth() === 0) }));
}

function yearTicks(start: number, end: number) {
  const first = new Date(start).getUTCFullYear() + 1;
  const years = new Date(end).getUTCFullYear() - first + 1;
  const step = Math.max(1, Math.ceil(years / MAX_TICKS));
  return Array.from({ length: Math.ceil(years / step) }, (_, i) => first + i * step).map((year) => ({
    time: Date.UTC(year, 0, 1),
    label: String(year),
  }));
}

/**
 * One date axis for every country's release row: each date's position as a percent along it, month ticks (years for
 * a long span), and today's position when it falls inside. `dates` are `YYYY-MM-DD`, oldest first.
 */
export function toReleaseAxis({ dates, today }: { dates: readonly string[]; today: string }) {
  const from = Date.parse(dates.at(0) ?? today);
  const to = Date.parse(dates.at(-1) ?? today);
  const span = Math.max(to - from, MIN_SPAN);
  const start = from - span * PAD;
  const end = from + span * (1 + PAD);
  const at = (time: number) => Math.round(((time - start) / (end - start)) * 10_000) / 100;
  const now = Date.parse(today);
  return {
    positions: dates.map((date) => at(Date.parse(date))),
    ticks: (span > YEARLY_AFTER ? yearTicks(start, end) : monthTicks(start, end)).map(({ time, label }) => ({
      at: at(time),
      label,
    })),
    today: now >= start && now <= end ? at(now) : null,
  };
}
