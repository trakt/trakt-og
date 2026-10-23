/** One of a team member's favorites: its poster, and its fanart for the panel's cover. */
export type AboutFavorite = {
  readonly key: string;
  readonly title: string;
  readonly year: number | null;
  readonly href: string;
  readonly poster: string | null;
  readonly fanart: string | null;
};
