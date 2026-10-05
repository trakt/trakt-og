import type { ScheduleDay } from './ScheduleDay.ts';
import type { ScheduleItem } from './ScheduleItem.ts';

/** One show (or movie) on one day: every episode it airs that day, at the first one's time and with its tag. */
export type ScheduleRow = ScheduleItem & { readonly episodes: readonly NonNullable<ScheduleItem['episode']>[] };

/** A day's rows: up to six, or past that the first five and the rest behind "Show N more". */
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

const MIN_CARDS = 3;
/** The days after the spotlight, on the right. */
const WEEK_DAYS = 2;
const ROWS = 6;
/** How far a card may run past the week before one fewer card is the better fit. */
const SLACK = 40;

/**
 * What the schedule draws at 1440px, in px, from its tokens in tokens.css (the schedule group). Change them together.
 * The count rule only adds these up; nothing on the page is measured.
 */
const HEIGHT = {
  /** A day's h3: `--font-size-schedule-day` at `--line-height-headings`, plus `--space-schedule-heading`. */
  heading: 27.4,
  /** `--space-schedule-day`, above every day but the first and above "Also tonight". */
  dayGap: 18,
  /** A row: `--schedule-row-poster` at 2:3, `--space-schedule-row` around it, the 1px separator. */
  row: 51,
  /** A card: `--schedule-card-poster` at 2:3 inside `--space-schedule-card`. */
  card: 120,
  /** A card's second episode line, and the `--space-schedule-line` above it. */
  cardLine: 31.9,
  /** `--space-schedule-card`, between two cards. */
  cardGap: 12,
  /** "Show N more": a `--font-size-small` line inside `--space-schedule-more`, the 1px separator. */
  more: 34,
  /** "Nothing on today.": a `--font-size-schedule-row` line in `--schedule-nothing-padding`, its border, and
   * `--space-schedule-heading`. */
  nothing: 52.6,
};

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

// Never "Show 1 more": six fit, past that five do.
function capped(rows: readonly ScheduleRow[]): Rows {
  const shown = rows.length > ROWS ? ROWS - 1 : ROWS;
  return { shown: rows.slice(0, shown), more: rows.slice(shown) };
}

function rowsHeight(rows: readonly ScheduleRow[]) {
  const { shown, more } = capped(rows);
  return shown.length * HEIGHT.row + (more.length > 0 ? HEIGHT.more : 0);
}

const cardHeight = ({ episodes }: ScheduleRow) => HEIGHT.card + (episodes.length === 2 ? HEIGHT.cardLine : 0);

function leftHeight(rows: readonly ScheduleRow[], cards: number, nothing: boolean) {
  const also = rows.slice(cards);
  return (nothing ? HEIGHT.nothing : 0) + HEIGHT.heading +
    rows.slice(0, cards).reduce((sum, row) => sum + cardHeight(row), 0) + (cards - 1) * HEIGHT.cardGap +
    (also.length > 0 ? HEIGHT.dayGap + HEIGHT.heading + rowsHeight(also) : 0);
}

const rightHeight = (days: readonly (readonly ScheduleRow[])[]) =>
  days.reduce((sum, rows, i) => sum + (i > 0 ? HEIGHT.dayGap : 0) + HEIGHT.heading + rowsHeight(rows), 0);

// From three cards (or all of them) up to every show, the count that makes the taller side shortest, letting the
// cards run up to SLACK past the week. A tie goes to more cards.
function cardCount(rows: readonly ScheduleRow[], week: number, nothing: boolean) {
  const from = Math.min(rows.length, MIN_CARDS);
  const cost = (cards: number) => Math.max(leftHeight(rows, cards, nothing), week + SLACK);

  return Array.from({ length: rows.length - from + 1 }, (_, i) => from + i)
    .reduce((best, cards) => (cost(cards) <= cost(best) ? cards : best), from);
}

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
 * The schedule's two sides: the first day with anything on as cards, then the rest of that day and the next two days
 * with anything on as rows, one per show. There are at least three cards (or as many as there are shows), and as many
 * more as keep the left side from running past the right. Null when nothing is on.
 */
export function toScheduleLayout(days: readonly ScheduleDay[]): ScheduleLayout | null {
  const [first, ...later] = days.filter(({ items }) => items.length > 0);
  if (!first) return null;

  const rows = toRows(first.items);
  const week = later.slice(0, WEEK_DAYS)
    .map(({ date, relative, short, items }) => ({ date, relative, short, rows: toRows(items) }));
  const nothing = nothingBefore(first.offset);
  const cards = cardCount(rows, rightHeight(week.map(({ rows }) => rows)), nothing !== undefined);
  const also = rows.slice(cards);

  return {
    spotlight: {
      heading: heading(first),
      short: first.short,
      nothing,
      cards: rows.slice(0, cards),
      also: also.length > 0
        ? {
          heading: first.offset === 0 ? 'Also tonight' : `Also ${first.relative}`,
          count: also.length,
          ...capped(also),
        }
        : undefined,
    },
    week: week.map(({ rows, ...day }) => ({ ...day, ...capped(rows) })),
  };
}
