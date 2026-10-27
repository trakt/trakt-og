/**
 * OG's "All" calendars, in sidebar order, with what each one lists. All Shows is cut: every episode airing anywhere
 * is too much data to load and too much to read. `/calendars/shows` redirects.
 */
export const PUBLIC_CALENDARS = [
  { slug: 'premieres', label: 'Premieres', itemType: 'episodes' },
  { slug: 'new-shows', label: 'New Shows', itemType: 'new shows' },
  { slug: 'finales', label: 'Finales', itemType: 'finales' },
  { slug: 'movies', label: 'Movies', itemType: 'movies' },
  { slug: 'streaming', label: 'Streaming', itemType: 'movies' },
  { slug: 'dvd', label: 'DVD & Blu-ray', itemType: 'movies' },
] as const;

export type PublicCalendar = (typeof PUBLIC_CALENDARS)[number];
