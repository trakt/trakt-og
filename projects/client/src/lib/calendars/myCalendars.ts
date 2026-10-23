/**
 * OG's eight "My" calendars, in sidebar order, with what each one lists.
 */
export const MY_CALENDARS = [
  { slug: 'shows-movies', label: 'Shows & Movies', itemType: 'items' },
  { slug: 'shows', label: 'Shows', itemType: 'episodes' },
  { slug: 'premieres', label: 'Premieres', itemType: 'episodes' },
  { slug: 'new-shows', label: 'New Shows', itemType: 'new shows' },
  { slug: 'finales', label: 'Finales', itemType: 'finales' },
  { slug: 'movies', label: 'Movies', itemType: 'movies' },
  { slug: 'streaming', label: 'Streaming', itemType: 'movies' },
  { slug: 'dvd', label: 'DVD & Blu-ray', itemType: 'movies' },
] as const;

export type MyCalendar = (typeof MY_CALENDARS)[number];
