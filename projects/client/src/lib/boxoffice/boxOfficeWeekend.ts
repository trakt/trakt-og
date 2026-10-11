const DAY = 86_400_000;

/** The weekend a box office chart covers, as `YYYY-MM-DD` dates and a heading ("Oct 2 – 4, 2026"). */
export type BoxOfficeWeekend = { readonly friday: string; readonly sunday: string; readonly label: string };

const iso = (time: number) => new Date(time).toISOString().slice(0, 10);
const part = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));

function label(friday: string, sunday: string) {
  const [fridayYear, sundayYear] = [friday.slice(0, 4), sunday.slice(0, 4)];
  if (fridayYear !== sundayYear) {
    return `${part(friday, { month: 'short', day: 'numeric', year: 'numeric' })} – ${
      part(sunday, { month: 'short', day: 'numeric', year: 'numeric' })
    }`;
  }
  const end = friday.slice(5, 7) === sunday.slice(5, 7)
    ? part(sunday, { day: 'numeric' })
    : part(sunday, { month: 'short', day: 'numeric' });
  return `${part(friday, { month: 'short', day: 'numeric' })} – ${end}, ${sundayYear}`;
}

/**
 * The last full Friday-to-Sunday weekend before `today` (the viewer's date, `YYYY-MM-DD`): the one the box office
 * reports, since it's updated on Monday mornings. On a Sunday the weekend still running isn't in yet.
 */
export function boxOfficeWeekend(today: string): BoxOfficeWeekend {
  const now = Date.parse(`${today}T00:00:00Z`);
  const weekday = new Date(now).getUTCDay();
  const sunday = now - (weekday === 0 ? 7 : weekday) * DAY;
  const friday = iso(sunday - 2 * DAY);
  return { friday, sunday: iso(sunday), label: label(friday, iso(sunday)) };
}
