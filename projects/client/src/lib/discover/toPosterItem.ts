import { imageUrl } from '../utils/imageUrl.ts';
import type { ThemeMedia } from './themeRowsSchema.ts';

/** A show or movie as discover's poster cards, the season wall and the hero show it. */
export type PosterItem = {
  readonly key: string;
  readonly type: 'movie' | 'show';
  readonly id: number;
  readonly href: string;
  readonly title: string;
  readonly year?: number;
  /** A movie's runtime; shows leave it out. */
  readonly runtime?: number;
  /** Trakt's 0 to 10 rating. */
  readonly rating?: number;
  /** Out by `now`. OG hid the rating of anything unreleased (`hideUnreleasedRatings`). */
  readonly released: boolean;
  readonly airedEpisodes?: number;
  readonly poster?: string;
  readonly fanart?: string;
  readonly logo?: string;
  /** "Horror, Thriller". */
  readonly genres?: string;
  readonly certification?: string;
  readonly network?: string;
  readonly overview?: string;
  /** A YouTube link. */
  readonly trailer?: string;
};

const humanize = (slug: string) => slug.replaceAll('-', ' ').replace(/^\w/, (letter) => letter.toUpperCase());

export function toPosterItem(media: ThemeMedia, type: 'movie' | 'show', now: Date): PosterItem {
  const releaseDate = type === 'show' ? media.first_aired : media.released;
  return {
    key: `${type}-${media.ids.trakt}`,
    type,
    id: media.ids.trakt,
    href: `/${type}s/${media.ids.slug}`,
    title: media.title,
    year: media.year ?? undefined,
    runtime: type === 'movie' ? (media.runtime ?? undefined) : undefined,
    rating: media.rating ?? undefined,
    released: releaseDate ? new Date(releaseDate) <= now : false,
    airedEpisodes: media.aired_episodes ?? undefined,
    poster: imageUrl(media.images?.poster?.at(0), 'thumb'),
    fanart: imageUrl(media.images?.fanart?.at(0), 'full'),
    logo: imageUrl(media.images?.logo?.at(0), 'medium'),
    genres: (media.genres ?? []).slice(0, 3).map(humanize).join(', ') || undefined,
    certification: media.certification ?? undefined,
    network: media.network ?? undefined,
    overview: media.overview?.trim() || undefined,
    trailer: media.trailer ?? undefined,
  };
}
