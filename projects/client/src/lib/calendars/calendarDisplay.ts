import type { toCalendarPreferences } from './toCalendarPreferences.ts';

export type CalendarView = 'list' | 'month' | 'agenda';
export type CalendarArtwork = ReturnType<typeof toCalendarPreferences>['imageType'];
export type CalendarEpisodes = 'grouped' | 'each';

/** How the calendar shows its month: the sidebar's Display section. */
export type CalendarDisplay = {
  readonly view: CalendarView;
  readonly artwork: CalendarArtwork;
  readonly episodes: CalendarEpisodes;
};

/** The cookies the Display section writes, a year each, shared by every calendar. */
export const CALENDAR_DISPLAY_COOKIES = {
  view: 'calendar_view',
  artwork: 'calendar_artwork',
  episodes: 'calendar_episodes',
} as const;

/** The artwork the Display section offers, in its order. */
export const CALENDAR_ARTWORK = [
  'poster',
  'logo',
  'fanart',
  'screenshot',
  'none',
] as const satisfies readonly CalendarArtwork[];

type CalendarDisplayParams = {
  cookies: { readonly get: (name: string) => string | undefined };
};

const isView = (value: string | undefined): value is CalendarView =>
  value === 'list' || value === 'month' || value === 'agenda';
const isEpisodes = (value: string | undefined): value is CalendarEpisodes => value === 'grouped' || value === 'each';
const isArtwork = (value: string | undefined): value is CalendarArtwork =>
  CALENDAR_ARTWORK.some((artwork) => artwork === value);

/** The viewer's display choices from their cookies: the month, posters and grouped episodes by default. */
export function calendarDisplay({ cookies }: CalendarDisplayParams): CalendarDisplay {
  const view = cookies.get(CALENDAR_DISPLAY_COOKIES.view);
  const artwork = cookies.get(CALENDAR_DISPLAY_COOKIES.artwork);
  const episodes = cookies.get(CALENDAR_DISPLAY_COOKIES.episodes);
  return {
    view: isView(view) ? view : 'month',
    artwork: isArtwork(artwork) ? artwork : 'poster',
    episodes: isEpisodes(episodes) ? episodes : 'grouped',
  };
}
