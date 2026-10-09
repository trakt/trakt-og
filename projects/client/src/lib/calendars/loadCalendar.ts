import { type Cookies, error, redirect } from '@sveltejs/kit';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { hasAdvancedFilters, parseAdvancedFilters } from '../components/filters/advancedFilters.ts';
import { advancedFiltersQuery } from '../components/filters/advancedFiltersQuery.ts';
import { fromFilterDraft, toFilterDraft } from '../components/filters/filterDraft.ts';
import { type FilterSource, toFilterSources } from '../components/filters/watchNowFilter.ts';
import { calendarDisplay } from './calendarDisplay.ts';
import { calendarFilters } from './calendarFilters.ts';
import { calendarWatchNow } from './calendarWatchNow.ts';
import { matchesCalendarFilters } from './matchesCalendarFilters.ts';
import { api } from '../api/api.ts';
import { parseFadeHide } from '../components/filters/fadeHide.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { calendarDays, dayIn } from './calendarDays.ts';
import { calendarRanges } from './calendarRanges.ts';
import { calendarWindow } from './calendarWindow.ts';
import { calendarFeedUrls } from './calendarFeedUrls.ts';
import { fetchCalendar } from './fetchCalendar.ts';
import { fetchHiddenCalendar, type HiddenCalendar } from './fetchHiddenCalendar.ts';
import { MY_CALENDARS } from './myCalendars.ts';
import { PUBLIC_CALENDARS } from './publicCalendars.ts';
import { viewerAirTime } from './viewerAirTime.ts';
import { toCalendarPreferences } from './toCalendarPreferences.ts';
import { withoutHidden } from './withoutHidden.ts';

type LoadCalendarParams = {
  fetch: typeof fetch;
  /** The layout's data, for the viewer's time zone and calendar settings. */
  parent: () => Promise<{ datePreferences: Pick<DatePreferences, 'timeZone'>; settings: unknown }>;
  url: URL;
  /** `all` is the public calendars (`/calendars/:slug`), `my` the viewer's (`/calendars/my/:slug`). */
  target: 'all' | 'my';
  slug: string;
  start: string | undefined;
  token: string | null;
  cookies: Pick<Cookies, 'get'>;
  sidenavHidden: boolean;
  now?: Date;
};

const NOTHING_HIDDEN: HiddenCalendar = { shows: new Set(), movies: new Set() };

function signIn(url: URL): never {
  redirect(302, `/auth/signin?redirect_to=${encodeURIComponent(url.pathname)}`);
}

/**
 * Loads one calendar month for SSR, with the viewer's display choices (list or month view, artwork, grouped episodes)
 * from their cookies. The public calendars go without the user's token: a stale cookie token would get a
 * 401 from the worker for data that doesn't depend on it. The My calendars need one, and send a signed-out viewer (or
 * one whose token stopped working) to sign in. Signed in, both leave out what the viewer hid from the calendar, and
 * specials with the "hide specials" setting on, as OG did on every calendar.
 */
export async function loadCalendar(
  { fetch, parent, url, target, slug, start, token, cookies, sidenavHidden, now = new Date() }: LoadCalendarParams,
) {
  const calendar = (target === 'my' ? MY_CALENDARS : PUBLIC_CALENDARS).find((c) => c.slug === slug);
  if (!calendar) error(404, 'Not Found');
  if (target === 'my' && !token) signIn(url);

  // Hidden items and shared settings run together. The feed range depends on the account's period/start day.
  const [hidden, { datePreferences, settings }] = await Promise.all([
    token ? fetchHiddenCalendar({ fetch, token }) : NOTHING_HIDDEN,
    parent(),
  ]);
  const preferences = toCalendarPreferences(token ? settings : null);
  const { timeZone } = datePreferences;
  const today = dayIn(now.toISOString(), timeZone);
  // Both views page by month; the month grid pads its own weeks.
  const window = calendarWindow({ start, today, period: 'month', layout: 'list', startDay: preferences.startDay });
  const display = calendarDisplay({
    cookies,
    accountArtwork: preferences.imageType,
    imagesAllowed: preferences.imagesAllowed,
  });
  const ranges = calendarRanges(window.request.start_date, window.request.days);
  const filterConfig = calendarFilters({ slug, now });
  const filters = fromFilterDraft(toFilterDraft(parseAdvancedFilters(url.searchParams), filterConfig), filterConfig);
  const query = advancedFiltersQuery(filters);
  const watchnow = calendarWatchNow(settings);
  const sources = filters.watchnow.length > 0
    ? rawApiFetch({ fetch, path: `/watchnow/sources/${watchnow.country}` })
      .then(async (response) =>
        response.ok ? toFilterSources(await response.json(), watchnow.country) : new Map<string, FilterSource>()
      )
      .catch(() => new Map<string, FilterSource>())
    : Promise.resolve(undefined);
  // Watch now is viewer-specific (country/favorites); other public filters carry no token.
  const calendarToken = target === 'my' || filters.watchnow.length > 0 ? token : null;
  // A token that stopped working loads no settings, so the page renders logged-out (All Shows' short feed included).
  const signedIn = token !== null && settings !== null;
  const fetchItems = (filterQuery: Readonly<Record<string, string>>, token: string | null) =>
    Promise.all(ranges.map(async (range) => {
      const request = { target, slug: calendar.slug, range, signedIn, filters: filterQuery };
      const response = await fetchCalendar({ client: api({ fetch, token }).calendars, ...request });
      return response === 'signed-out' && target === 'all'
        ? fetchCalendar({ ...request, client: api({ fetch }).calendars })
        : response;
    }));
  // Filtered, the sidebar counts "12 of 40": the same month without filters, fetched alongside.
  const filtered = hasAdvancedFilters(filters);
  const [responses, unfilteredResponses] = await Promise.all([
    fetchItems(query, calendarToken),
    filtered ? fetchItems({}, target === 'my' ? token : null) : Promise.resolve(undefined),
  ]);
  if ([...responses, ...(unfilteredResponses ?? [])].some((items) => items === 'signed-out')) signIn(url);
  const flatten = (lists: typeof responses) => lists.flatMap((items) => items === 'signed-out' ? [] : items);
  const visible = (items: ReturnType<typeof flatten>) =>
    withoutHidden(items, { hidden, hideSpecials: preferences.hideSpecials });
  const shown = visible(flatten(responses).filter((item) => matchesCalendarFilters(item, filters)));
  const toDays = (items: ReturnType<typeof visible>) =>
    calendarDays({ dates: window.dates, items: items.map((item) => viewerAirTime(item, timeZone)), timeZone });
  const unfiltered = unfilteredResponses ? toDays(visible(flatten(unfilteredResponses))) : undefined;

  return {
    calendar,
    filterConfig,
    filters,
    filterSources: await sources,
    watchNowCountry: watchnow.country,
    watchNowFavorites: watchnow.favorites,
    target,
    today,
    window,
    preferences,
    display,
    days: toDays(shown),
    /** Without filters: what the sidebar's counts are out of. Left out when nothing is filtered. */
    totals: unfiltered && {
      episodes: unfiltered.flatMap((day) => day.items).filter((item) => item.type === 'episode').length,
      movies: unfiltered.flatMap((day) => day.items).filter((item) => item.type === 'movie').length,
    },
    // OG's eye menu, one choice for every calendar (`filter-fade-calendars-*`). The page fades and hides by the overlay.
    fadeHide: {
      fade: parseFadeHide(cookies.get('filter-fade-calendars')),
      hide: parseFadeHide(cookies.get('filter-hide-calendars')),
    },
    // OG's VIP sidebar toggle; the page ignores it for everyone else.
    sidenavHidden,
    feedUrls: calendarFeedUrls(settings),
  };
}
