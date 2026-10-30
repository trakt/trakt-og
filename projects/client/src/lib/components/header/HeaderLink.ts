/** Where a header link comes from, which is also the add picker's group. */
export type HeaderLinkGroup = 'main' | 'profile' | 'movies' | 'shows' | 'my-calendars' | 'all-calendars';

/** One link a member can put in the header bar. */
export type HeaderLink = {
  /** What the og-header cookie keeps. Never rename one, or members lose it. */
  readonly id: string;
  /** The bar's label. */
  readonly title: string;
  /** The picker's label, under its group heading: "Box Office" under Movies. */
  readonly label: string;
  readonly group: HeaderLinkGroup;
  readonly href: string;
  /** Current only on its own path, not under it: Profile, which every profile tab sits under. */
  readonly exact?: boolean;
};
