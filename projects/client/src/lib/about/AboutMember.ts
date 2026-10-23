import type { AboutFavorite } from './AboutFavorite.ts';

/** One Trakt team member on the about page's banners. */
export type AboutMember = {
  readonly slug: string;
  readonly username: string;
  readonly name: string;
  readonly avatar: string;
  readonly location: string | null;
  /** The year they joined Trakt. */
  readonly since: number | null;
  /** Up to ten favorites, in their own order; the page shuffles them on every visit. */
  readonly favorites: readonly AboutFavorite[];
  readonly episodes: number;
  readonly movies: number;
};
