import { error } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { chartPeriod } from '../charts/chartPeriod.ts';
import { boxOfficeWeekend } from './boxOfficeWeekend.ts';
import { toBoxOfficeRow } from './toBoxOfficeRow.ts';
import { toOpeningRow } from './toOpeningRow.ts';
import { dayIn } from '../utils/dayIn.ts';

// The IMDb weekend box office list the chart is built
const BOX_OFFICE_LIST_ID = '1267169';
// The sidebar's openers: the first few on the movies calendar for the coming Friday.
const OPENING_SHOWN = 6;
const DAY = 86_400_000;

/** The coming Friday (today, on a Friday) as `YYYY-MM-DD` and as a heading's date ("Oct 16"). */
function nextFriday(today: string) {
  const date = Date.parse(`${today}T00:00:00Z`);
  const friday = new Date(date + ((5 - new Date(date).getUTCDay() + 7) % 7) * DAY);
  const label = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(friday);
  return { date: friday.toISOString().slice(0, 10), label };
}

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
 * for the under-title, and the films opening on the coming Friday for the sidebar. All public, so they go without the token.
 * There's no paging. A movies calendar that fails only costs the sidebar its openers.
 */
export async function loadBoxOffice({ fetch, cookies, parent, now = new Date() }: LoadBoxOfficeParams) {
  const client = api({ fetch });
  const layout = parent();
  const today = layout.then(({ datePreferences }) => dayIn(now, datePreferences.timeZone));
  const [response, list, date, opening] = await Promise.all([
    client.movies.boxoffice({ query: { extended: 'full,images' } }),
    client.lists.summary({ params: { id: BOX_OFFICE_LIST_ID } }),
    today,
    today.then((start) =>
      client.calendars.movies({
        params: { target: 'all', start_date: nextFriday(start).date, days: 1 },
        query: { extended: 'full,images' },
      }),
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
    opening: {
      /** "Oct 16", for "Opening Friday Oct 16". */
      friday: nextFriday(date).label,
      films: opening.status === 200 ? opening.body.slice(0, OPENING_SHOWN).map(toOpeningRow) : [],
    },
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
