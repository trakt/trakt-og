import type { ScheduleDay } from './ScheduleDay.ts';
import type { ScheduleItem } from './ScheduleItem.ts';

/** One show (or movie) on one day: every episode it airs that day, at the first one's time and with its tag. */
export type ScheduleRow = ScheduleItem & { readonly episodes: readonly NonNullable<ScheduleItem['episode']>[] };

/** A day's rows: the first five, then the rest behind "Show N more". */
type Rows = { readonly shown: readonly ScheduleRow[]; readonly more: readonly ScheduleRow[] };

export type ScheduleLayout = {
  /** The first day with anything on. */
  readonly spotlight: {
    /** "Tonight", "Next up · Thursday", or the day's name for one before today. */
    readonly heading: string;
    readonly short: string;
    /** "Nothing on today." when the spotlight is a later day. */
    readonly nothing?: string;
    readonly cards: readonly ScheduleRow[];
    /** The rest of the spotlight day, under "Also tonight". */
    readonly also?: Rows & { readonly heading: string; readonly count: number };
  };
  readonly week: readonly (Rows & Pick<ScheduleDay, 'date' | 'relative' | 'short'>)[];
};

const CARDS = 3;
const ROWS = 5;

// Items come in air order, so each show's row sits at its first episode's time.
function toRows(items: readonly ScheduleItem[]): ScheduleRow[] {
  return [...Map.groupBy(items, ({ group }) => group).values()].flatMap((same) => {
    const first = same.at(0);
    if (!first) return [];

    return [{
      ...first,
      watchNow: same.find(({ watchNow }) => watchNow)?.watchNow,
      episodes: same.flatMap(({ episode }) => (episode ? [episode] : [])),
    }];
  });
}

const capped = (rows: readonly ScheduleRow[]): Rows => ({ shown: rows.slice(0, ROWS), more: rows.slice(ROWS) });

function nothingBefore(offset: number) {
  if (offset <= 0) return undefined;
  if (offset === 1) return 'Nothing on today.';
  if (offset === 2) return 'Nothing on today or tomorrow.';
  return `Nothing on for the next ${offset} days.`;
}

function heading({ offset, relative }: ScheduleDay) {
  if (offset === 0) return 'Tonight';
  return offset > 0 ? `Next up · ${relative}` : relative;
}

/**
 * The schedule's two sides: the first day with anything on as up to three cards, then the rest of that day and the
 * days after it as rows, one per show. Null when nothing is on.
 */
export function toScheduleLayout(days: readonly ScheduleDay[]): ScheduleLayout | null {
  const [first, ...rest] = days.filter(({ items }) => items.length > 0);
  if (!first) return null;

  const rows = toRows(first.items);
  const also = rows.slice(CARDS);

  return {
    spotlight: {
      heading: heading(first),
      short: first.short,
      nothing: nothingBefore(first.offset),
      cards: rows.slice(0, CARDS),
      also: also.length > 0
        ? {
          heading: first.offset === 0 ? 'Also tonight' : `Also ${first.relative}`,
          count: also.length,
          ...capped(also),
        }
        : undefined,
    },
    week: rest.map(({ date, relative, short, items }) => ({ date, relative, short, ...capped(toRows(items)) })),
  };
}
