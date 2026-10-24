import { api } from '../api/api.ts';
import { hiddenCalendarSchema } from './hiddenCalendarSchema.ts';

/** The shows and movies the viewer hid from the calendar, by Trakt id. */
export type HiddenCalendar = { shows: ReadonlySet<number>; movies: ReadonlySet<number> };

const NOTHING_HIDDEN: HiddenCalendar = { shows: new Set(), movies: new Set() };

// API has no cap on this route's limit, so one page holds every hidden item.
const LIMIT = 10_000;

/**
 * OG's `Ignore.show_ids` / `Ignore.movie_ids` for the calendar section. The worker's
 * calendars don't read them, so og drops the items itself. A failed or malformed response hides nothing: the calendar
 * still renders, with the hidden items in it.
 */
export async function fetchHiddenCalendar({ fetch, token }: { fetch: typeof globalThis.fetch; token: string | null }) {
  const response = await api({ fetch, token })
    .users.hidden.getBySection({
      params: { section: 'calendar' },
      query: { limit: LIMIT },
    })
    .catch(() => null);
  if (response?.status !== 200) return NOTHING_HIDDEN;

  const rows = hiddenCalendarSchema.safeParse(response.body);
  if (!rows.success) return NOTHING_HIDDEN;

  const ids = (type: 'show' | 'movie') =>
    new Set(
      rows.data.flatMap((row) => {
        const id = row.type === type ? row[type]?.ids.trakt : undefined;
        return id === undefined ? [] : [id];
      }),
    );

  return { shows: ids('show'), movies: ids('movie') } satisfies HiddenCalendar;
}
