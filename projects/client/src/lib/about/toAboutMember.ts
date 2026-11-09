import { PLACEHOLDER_AVATAR } from '../users/placeholderAvatar.ts';
import { mediaImage } from '../images/mediaImage.ts';
import { userAvatar } from '../images/userAvatar.ts';
import type { AboutFavorite } from './AboutFavorite.ts';
import type { AboutMember } from './AboutMember.ts';

type Media = {
  readonly title: string;
  readonly year?: number | null;
  readonly ids: { readonly trakt: number; readonly slug: string };
};

/** A favorite row: a movie or a show, from `/users/:id/favorites`. */
export type AboutFavoriteRow =
  | { readonly type: 'movie'; readonly movie: Media }
  | { readonly type: 'show'; readonly show: Media };

/** The fields of a team member's `user` (`GET /team?extended=full`) the banner reads. */
export type AboutUserRow = {
  readonly username: string;
  readonly name?: string | null;
  readonly ids: { readonly slug?: string | null; readonly trakt?: number | null };
  readonly location?: string | null;
  readonly joined_at?: string | null;
};

type Stats = { readonly movies: { readonly watched: number }; readonly episodes: { readonly watched: number } };

interface ToAboutMemberParams {
  user: AboutUserRow;
  favorites: readonly AboutFavoriteRow[];
  stats: Stats | null;
}

const mediaOf = (row: AboutFavoriteRow) => (row.type === 'movie' ? row.movie : row.show);

const toFavorite = (row: AboutFavoriteRow): AboutFavorite => {
  const media = mediaOf(row);
  return {
    key: `${row.type}-${media.ids.slug}`,
    title: media.title,
    year: media.year ?? null,
    href: `/${row.type}s/${media.ids.slug}`,
    poster: mediaImage({ type: row.type, id: media.ids.trakt, slot: 'poster', size: 'medium' }),
    fanart: mediaImage({ type: row.type, id: media.ids.trakt, slot: 'fanart', size: 'full' }),
  };
};

const yearOf = (date: string | null | undefined) => {
  const year = Number(date?.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : null;
};

/** The most favorites a member keeps; the page shows a shuffled handful. */
const FAVORITES = 10;

/** A team member, their favorites in their own order, and what they've watched. */
export function toAboutMember({ user, favorites, stats }: ToAboutMemberParams): AboutMember {
  return {
    slug: user.ids.slug ?? user.username,
    username: user.username,
    name: user.name?.trim() || user.username,
    avatar: user.ids.trakt ? userAvatar(user.ids.trakt) : PLACEHOLDER_AVATAR,
    location: user.location?.trim() || null,
    since: yearOf(user.joined_at),
    favorites: favorites.slice(0, FAVORITES).map(toFavorite),
    episodes: stats?.episodes.watched ?? 0,
    movies: stats?.movies.watched ?? 0,
  };
}
