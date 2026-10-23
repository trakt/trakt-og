import type { AboutSection } from './AboutSection.ts';

const sectionsByScope: Readonly<Record<string, AboutSection>> = {
  users: 'Profiles',
  media: 'Titles',
  design: 'Design',
  ds: 'Design',
  icons: 'Design',
  tokens: 'Design',
  overlay: 'Design',
  dashboard: 'Dashboard',
  calendars: 'Calendar',
  comments: 'Comments',
  search: 'Search',
  layout: 'Layout',
  drawer: 'Layout',
  discover: 'Discover',
  movies: 'Movies',
  shows: 'Shows',
  episode: 'Shows',
  lists: 'Lists',
  list: 'Lists',
  people: 'People',
  charts: 'Charts',
  home: 'Home',
  about: 'About',
  i18n: 'Languages',
  settings: 'Settings',
};

/** The site section a commit scope belongs to; infrastructure and unscoped commits are General. */
export function sectionOfScope(scope: string): AboutSection {
  return sectionsByScope[scope] ?? 'General';
}
