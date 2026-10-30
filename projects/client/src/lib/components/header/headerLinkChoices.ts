import { calendarHome } from '$lib/calendars/calendarHome';
import { MY_CALENDARS } from '$lib/calendars/myCalendars';
import { PUBLIC_CALENDARS } from '$lib/calendars/publicCalendars';
import type { HeaderLink, HeaderLinkGroup } from './HeaderLink.ts';

type HeaderLinkChoicesParams = {
  /** The viewer's slug, for their profile pages. Null while signed out or while a session renews. */
  slug: string | null;
  signedIn: boolean;
};

const PROFILE_PAGES = [
  'History',
  'Progress',
  'Library',
  'Ratings',
  'Lists',
  'Watchlist',
  'Favorites',
  'Comments',
  'Notes',
  'Network',
] as const;

// [path, picker label, bar title with `{type}` for Movies or Shows], in the chart nav's order (chartLinks).
const CHARTS = [
  ['trending', 'Trending', 'Trending {type}'],
  ['recommendations', 'Recommendations', 'Recommended {type}'],
  ['anticipated', 'Anticipated', 'Anticipated {type}'],
  ['popular', 'Popular', 'Popular {type}'],
  ['favorited', 'Favorited', 'Favorited {type}'],
  ['watched', 'Watched', 'Most Watched {type}'],
  ['library', 'Libraries', '{type} in Libraries'],
] as const;

function charts(type: 'Movies' | 'Shows', group: HeaderLinkGroup): HeaderLink[] {
  return CHARTS.map(([path, label, title]) => ({
    id: `${group}-${path}`,
    title: title.replace('{type}', type),
    label,
    group,
    href: `/${group}/${path}`,
  }));
}

// The picker lists each calendar under My Calendars or All Calendars; the bar says which.
function calendars(signedIn: boolean): HeaderLink[] {
  const mine = MY_CALENDARS.map(({ slug, label }) => ({
    id: `calendar-my-${slug}`,
    title: `My ${label}`,
    label,
    group: 'my-calendars' as const,
    href: `/calendars/my/${slug}`,
  }));
  const all = PUBLIC_CALENDARS.map(({ slug, label }) => ({
    id: `calendar-${slug}`,
    title: `All ${label}`,
    label,
    group: 'all-calendars' as const,
    href: `/calendars/${slug}`,
  }));
  return [...(signedIn ? mine : []), ...all];
}

/**
 * Every link the header can show, in the picker's order: the main links, the show charts, the movie charts with Box
 * Office, the calendars, My before All like OG's sidebar, then the viewer's profile pages. The main links are the
 * bar's defaults (`headerLinkPrefs.DEFAULTS`).
 */
export function headerLinkChoices({ slug, signedIn }: HeaderLinkChoicesParams): HeaderLink[] {
  const main = (id: string, title: string, href: string): HeaderLink => ({
    id,
    title,
    label: title,
    group: 'main',
    href,
  });
  const profile = (title: string, path: string, exact = false): HeaderLink => ({
    id: title.toLowerCase(),
    title,
    label: title,
    group: 'profile',
    href: `/users/${slug}${path}`,
    exact,
  });

  return [
    ...(signedIn ? [main('dashboard', 'Dashboard', '/dashboard')] : []),
    main('discover', 'Discover', '/discover'),
    main('shows', 'Shows', '/shows/trending'),
    main('movies', 'Movies', '/movies/trending'),
    main('calendar', 'Calendar', calendarHome(signedIn)),
    ...charts('Shows', 'shows'),
    ...charts('Movies', 'movies'),
    { id: 'movies-boxoffice', title: 'Box Office', label: 'Box Office', group: 'movies', href: '/movies/boxoffice' },
    ...calendars(signedIn),
    ...(slug
      ? [profile('Profile', '', true), ...PROFILE_PAGES.map((page) => profile(page, `/${page.toLowerCase()}`))]
      : []),
  ];
}
