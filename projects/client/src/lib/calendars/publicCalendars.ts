/**
 * OG's seven "All" calendars, in sidebar order, with what each one lists.
 */
export const PUBLIC_CALENDARS = [
  { slug: 'shows', label: 'Shows', itemType: 'episodes' },
  { slug: 'premieres', label: 'Premieres', itemType: 'episodes' },
  { slug: 'new-shows', label: 'New Shows', itemType: 'new shows' },
  { slug: 'finales', label: 'Finales', itemType: 'finales' },
  { slug: 'movies', label: 'Movies', itemType: 'movies' },
  { slug: 'streaming', label: 'Streaming', itemType: 'movies' },
  { slug: 'dvd', label: 'DVD & Blu-ray', itemType: 'movies' },
] as const;

export type PublicCalendar = (typeof PUBLIC_CALENDARS)[number];
