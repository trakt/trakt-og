import { z } from 'zod/v4';
import { MY_CALENDARS } from './myCalendars.ts';
import { PUBLIC_CALENDARS } from './publicCalendars.ts';

/**
 * The viewer's saved calendar filters, kept in this browser's storage alone: the API has no home for them, and smart
 * lists can't fill from a calendar.
 */
export const SAVED_CALENDAR_FILTERS_KEY = 'og-calendar-saved-filters';

/** The calendar query param naming the saved filter a calendar was opened from, like a chart's `smart`. */
export const SAVED_FILTER_PARAM = 'saved';

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type SavedCalendarFilter = {
  readonly name: string;
  /** The calendar without a month, so the filter opens on the current one. */
  readonly path: string;
  /** The filters, as the page's query without the `?`. */
  readonly query: string;
};

const savedSchema = z.array(
  z.object({
    name: z.string().trim().min(1),
    path: z.string().regex(/^\/calendars\/[a-z/-]+$/),
    query: z.string(),
  }),
);

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/** The saved filters from their stored value, or none when it's missing or unreadable. */
export function parseSavedCalendarFilters(value: string | null | undefined): readonly SavedCalendarFilter[] {
  if (!value) return [];
  const parsed = savedSchema.safeParse(parseJson(value));
  return parsed.success ? parsed.data : [];
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Adds a filter at the end. One saved under a name already used replaces that one in its place. */
export function withSavedCalendarFilter(
  list: readonly SavedCalendarFilter[],
  filter: SavedCalendarFilter,
): readonly SavedCalendarFilter[] {
  if (!list.some(({ name }) => sameName(name, filter.name))) return [...list, filter];
  return list.map((saved) => (sameName(saved.name, filter.name) ? filter : saved));
}

export const withoutSavedCalendarFilter = (list: readonly SavedCalendarFilter[], name: string) =>
  list.filter((saved) => saved.name !== name);

/**
 * The saved filters in the browser's storage, or none when it can't be read (blocked storage, a private window). The
 * storage comes by a function, since only reading `localStorage` can throw.
 */
export function readSavedCalendarFilters(storage: () => Storage): readonly SavedCalendarFilter[] {
  try {
    return parseSavedCalendarFilters(storage().getItem(SAVED_CALENDAR_FILTERS_KEY));
  } catch {
    return [];
  }
}

/** Keeps `list` in the browser's storage, and says whether it could. An empty list clears it. */
export function writeSavedCalendarFilters(storage: () => Storage, list: readonly SavedCalendarFilter[]): boolean {
  try {
    if (list.length === 0) storage().removeItem(SAVED_CALENDAR_FILTERS_KEY);
    else storage().setItem(SAVED_CALENDAR_FILTERS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export const savedCalendarFilterPath = ({ target, slug }: { target: 'all' | 'my'; slug: string }) =>
  `/calendars/${target === 'my' ? 'my/' : ''}${slug}`;

/** A saved filter's short, stable id for the URL, from its name: names are unique, and never change once saved. */
export function savedCalendarFilterId(name: string): string {
  const key = name.trim().toLowerCase();
  return [...key].reduce((hash, char) => (Math.imul(hash, 31) + (char.codePointAt(0) ?? 0)) >>> 0, 7).toString(36);
}

/** The filters' query on `path`, naming the saved filter so the calendar knows it's open. */
export const savedCalendarFilterHref = ({ name, path, query }: SavedCalendarFilter) =>
  `${path}?${[query, `${SAVED_FILTER_PARAM}=${savedCalendarFilterId(name)}`].filter(Boolean).join('&')}`;

/** The calendar a saved filter opens, "My Premieres" or "Premieres", for its tag. */
export function savedCalendarFilterLabel(path: string): string | undefined {
  const [first, second] = path.split('/').slice(2);
  if (first !== 'my') return PUBLIC_CALENDARS.find(({ slug }) => slug === first)?.label;
  const calendar = MY_CALENDARS.find(({ slug }) => slug === second);
  return calendar && `My ${calendar.label}`;
}
