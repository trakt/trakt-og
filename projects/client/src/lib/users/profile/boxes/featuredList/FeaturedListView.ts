/** The featured list. The owner's chosen one isn't in the API, so it's always the watchlist. */
export type FeaturedListView = {
  readonly name: string;
  readonly href: string;
  /** How many items, 0 when the list is empty. */
  readonly items: number;
  /** The first item's fanart. */
  readonly image?: string;
  /** Up to three posters for the fanned stack. */
  readonly posters: readonly string[];
  /** The first titles on it, next up: "The Pitt", "Andor", "Slow Horses". */
  readonly next: readonly string[];
};
