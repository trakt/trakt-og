/** The featured list. The owner's chosen one isn't in the API, so it's always the watchlist. */
export type FeaturedListView = {
  readonly name: string;
  readonly href: string;
  /** "34 items", or `null` when the list is empty. */
  readonly count: string | null;
  /** The first item's fanart. */
  readonly image?: string;
  /** Up to three posters for the fanned stack. */
  readonly posters: readonly string[];
  /** "Next up: The Pitt, Andor, Slow Horses". */
  readonly next: string | null;
};
