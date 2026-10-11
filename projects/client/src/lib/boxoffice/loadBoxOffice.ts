import { error } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { chartPeriod } from '../charts/chartPeriod.ts';
import { boxOfficeWeekend } from './boxOfficeWeekend.ts';
import { toBoxOfficeRow } from './toBoxOfficeRow.ts';
import { toOpeningRow } from './toOpeningRow.ts';

// The IMDb weekend box office list the chart is built
const BOX_OFFICE_LIST_ID = '1267169';
// The sidebar's Opening This Week: the next week of the movies calendar, the first few of it.
const OPENING_DAYS = 7;
const OPENING_SHOWN = 6;

type LoadBoxOfficeParams = {
  fetch: typeof fetch;
  /** The request's cookies, for the sidebar's state. */
  cookies: { get: (name: string) => string | undefined };
  /** The layout's data, for the viewer's date and zone. */
  parent: () => Promise<{ datePreferences: { timeZone: string } }>;
  now?: Date;
};

/**
 * Loads the weekend box office: the top 10 with their gross and run, the weekend it covers, the list's description
 * for the under-title, and the films opening this week for the sidebar. All public, so they go without the token.
 * There's no paging. A movies calendar that fails only costs the sidebar its openers.
 */
export async function loadBoxOffice({ fetch, cookies, parent, now = new Date() }: LoadBoxOfficeParams) {
  const client = api({ fetch });
  const layout = parent();
  const today = layout.then(({ datePreferences }) =>
    now.toLocaleDateString('en-CA', { timeZone: datePreferences.timeZone })
  );
  const [response, list, date, opening] = await Promise.all([
    client.movies.boxoffice({ query: { extended: 'full,images' } }),
    client.lists.summary({ params: { id: BOX_OFFICE_LIST_ID } }),
    today,
    today.then((start) =>
      client.calendars.movies({
        params: { target: 'all', start_date: start, days: OPENING_DAYS },
        query: { extended: 'full,images' },
      })
    ),
  ]);
  if (response.status !== 200) error(502, 'The Trakt API could not load the box office.');

  const weekend = boxOfficeWeekend(date);
  const rows = response.body.map((row) => toBoxOfficeRow(row, weekend.friday));
  return {
    type: 'movies' as const,
    chart: 'boxoffice' as const,
    /** The weekly default the picker's period links keep, as in OG. */
    period: chartPeriod(undefined),
    weekend,
    rows,
    /** The top 10's weekend gross together. */
    total: rows.reduce((sum, row) => sum + row.revenue, 0),
    opening: opening.status === 200
      ? opening.body.slice(0, OPENING_SHOWN).map((entry) => toOpeningRow(entry, date))
      : [],
    /** The under-title and meta description. OG read it off the list, so a list we can't load leaves it blank. */
    description: list.status === 200 ? (list.body.description ?? '') : '',
    /** The sidebar's own state, so SSR renders it as the viewer left it, like the calendar's. */
    sidebar: {
      collapsed: cookies.get('sidebar_collapsed') !== undefined,
      weekend: cookies.get('sidebar_weekend') !== 'closed',
      opening: cookies.get('sidebar_opening') !== 'closed',
    },
  };
}
