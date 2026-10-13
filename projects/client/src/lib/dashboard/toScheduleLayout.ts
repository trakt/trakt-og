import type { ScheduleDay } from './ScheduleDay.ts';
import type { ScheduleItem } from './ScheduleItem.ts';

/** One show (or movie) on one day: every episode it airs that day, at the first one's time and with its tag. */
export type ScheduleRow = ScheduleItem & { readonly episodes: readonly NonNullable<ScheduleItem['episode']>[] };

/** What a day shows up front, and the rest behind "Show N more". */
type Rows = { readonly shown: readonly ScheduleRow[]; readonly more: readonly ScheduleRow[] };

export type ScheduleLayout = {
  /** The first day with anything on, as cards. */
  readonly spotlight: Rows & {
    /** "Tonight", or the day's name ("Tomorrow", "Thursday", "Yesterday"). */
    readonly heading: string;
    readonly short: string;
    /** "Nothing on today." when the spotlight is a later day, after its date. */
    readonly nothing?: string;
  };
  /** The next days with anything on, as rows under it. */
  readonly week: readonly (Rows & Pick<ScheduleDay, 'date' | 'relative' | 'short'>)[];
};

/** Two rows of three at 1440px. */
const CARDS = 6;
const WEEK_DAYS = 4;
const ROWS = 6;

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

// Never "Show 1 more": up to `max` fit, past that one fewer does.
function capped(rows: readonly ScheduleRow[], max: number): Rows {
  const shown = rows.length > max ? max - 1 : max;
  return { shown: rows.slice(0, shown), more: rows.slice(shown) };
}

function nothingBefore(offset: number) {
  if (offset <= 0) return undefined;
  if (offset === 1) return 'Nothing on today.';
  if (offset === 2) return 'Nothing on today or tomorrow.';
  return `Nothing on for the next ${offset} days.`;
}

const heading = ({ offset, relative }: ScheduleDay) => (offset === 0 ? 'Tonight' : relative);

/**
 * The schedule's two bands: the first day with anything on as cards with medium posters, then the next four days with
 * anything on as rows with small ones, one per show. Null when nothing is on.
 */
export function toScheduleLayout(days: readonly ScheduleDay[]): ScheduleLayout | null {
  const [first, ...later] = days.filter(({ items }) => items.length > 0);
  if (!first) return null;

  return {
    spotlight: {
      heading: heading(first),
      short: first.short,
      nothing: nothingBefore(first.offset),
      ...capped(toRows(first.items), CARDS),
    },
    week: later.slice(0, WEEK_DAYS)
      .map(({ date, relative, short, items }) => ({ date, relative, short, ...capped(toRows(items), ROWS) })),
  };
}
