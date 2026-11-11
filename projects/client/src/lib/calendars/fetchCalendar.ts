import { error } from '@sveltejs/kit';
import type { api } from '../api/api.ts';
import type { CalendarItem } from './calendarDays.ts';
import type { MyCalendar } from './myCalendars.ts';
import type { PublicCalendar } from './publicCalendars.ts';
import { toCalendarItems } from './toCalendarItems.ts';

type FetchCalendarParams = {
  client: ReturnType<typeof api>['calendars'];
  /** `my` reads the token owner's calendar, so its client carries the token; `all` goes without one. */
  target: 'all' | 'my';
  slug: PublicCalendar['slug'] | MyCalendar['slug'];
  range: { start_date: string; days: number };
  filters?: Readonly<Record<string, string>>;
};

function request({ client, target, slug, range, filters }: FetchCalendarParams) {
  const query = { extended: 'full' as const, ...filters };
  const params = { target, ...range };

  switch (slug) {
    // The merged `media` calendar always drops specials, so it's read as its two halves: the same queries it runs.
    case 'shows-movies':
      return Promise.all([client.shows({ params, query }), client.movies({ params, query })]);
    case 'shows':
      return client.shows({ params, query });
    case 'premieres':
      return client.seasonPremieres({ params, query });
    case 'new-shows':
      return client.newShows({ params, query });
    case 'finales':
      return client.finales({ params, query });
    case 'movies':
      return client.movies({ params, query });
    case 'streaming':
      return client.streaming({ params, query });
    case 'dvd':
      return client.dvdReleases({ params, query });
  }
}

/**
 * One calendar window's entries. A 401 (a My calendar with a token that stopped working) comes back as `signed-out`
 * for the loader to send the viewer to sign in; anything else that isn't a 200 is a 502.
 */
export async function fetchCalendar(params: FetchCalendarParams): Promise<CalendarItem[] | 'signed-out'> {
  const responses = [await request(params)].flat();
  if (responses.some((response) => response.status === 401)) return 'signed-out';
  if (responses.some((response) => response.status !== 200)) error(502, 'The calendar is unavailable right now.');

  return responses.flatMap((response) => (response.status === 200 ? toCalendarItems(response.body) : []));
}
