import { creditFame } from './creditFame.ts';
import type { PersonCredit } from './PersonCredit.ts';

/** Five years of a career: 2005 to 2009. */
export type CareerEra = {
  readonly start: number;
  readonly end: number;
  readonly credits: readonly PersonCredit[];
  /** The era's best-known credit in the span, by `creditFame`. */
  readonly top?: PersonCredit;
};

const ERA_YEARS = 5;

type ToCareerErasParams = {
  credits: readonly PersonCredit[];
  /** The credits that set where the career starts and ends; archive footage would stretch it back before it began. */
  span?: readonly PersonCredit[];
};

/**
 * Every five-year stretch from the first dated credit in `span` to the last, empty ones included so the bars keep
 * their spacing. Each era counts all of `credits` in its years, so it matches the list it narrows.
 */
export function toCareerEras({ credits, span = credits }: ToCareerErasParams): CareerEra[] {
  const years = span.flatMap(({ year }) => (year ? [year] : []));
  const spanned = new Set(span);
  if (years.length === 0) return [];

  const first = Math.floor(Math.min(...years) / ERA_YEARS) * ERA_YEARS;
  const last = Math.floor(Math.max(...years) / ERA_YEARS) * ERA_YEARS;

  return Array.from({ length: (last - first) / ERA_YEARS + 1 }, (_, i) => {
    const start = first + i * ERA_YEARS;
    const end = start + ERA_YEARS - 1;
    const inEra = credits.filter(({ year }) => year !== undefined && year >= start && year <= end);
    const top = inEra.filter((credit) => spanned.has(credit)).toSorted((a, b) => creditFame(b) - creditFame(a)).at(0);
    return { start, end, credits: inEra, top };
  });
}
