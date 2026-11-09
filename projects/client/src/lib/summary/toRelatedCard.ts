import type { MovieResponse, ShowResponse } from '@trakt/api';
import { mediaImage } from '../images/mediaImage.ts';

export type RelatedCard = {
  readonly type: 'movie' | 'show';
  readonly id: number;
  readonly href: string;
  readonly title: string;
  readonly year?: number;
  readonly poster?: string;
  /** The phone layout's fanart cards. */
  readonly fanart?: string;
  /** Out by `now`. OG hid the rating of anything unreleased or undated (`hideUnreleasedRatings`). */
  readonly released: boolean;
  readonly rating?: number;
  readonly airedEpisodes?: number;
  readonly runtime?: number;
  /** Slugs, for what the pick shares with the summary's title. */
  readonly subgenres: readonly string[];
};

type Related =
  | { readonly type: 'movie'; readonly item: MovieResponse }
  | {
      readonly type: 'show';
      readonly item: ShowResponse;
    };

/** One `/:type/:id/related?extended=full` row as a poster card. */
export function toRelatedCard(related: Related, now: Date): RelatedCard {
  const { type, item } = related;
  const releaseDate = related.type === 'show' ? related.item.first_aired : related.item.released;

  return {
    type,
    id: item.ids.trakt,
    href: `/${type}s/${item.ids.slug}`,
    title: item.title,
    year: item.year ?? undefined,
    poster: mediaImage({ type, id: item.ids.trakt, slot: 'poster', size: 'thumb' }),
    fanart: mediaImage({ type, id: item.ids.trakt, slot: 'fanart', size: 'thumb' }),
    released: releaseDate ? new Date(releaseDate) <= now : false,
    rating: item.rating ?? undefined,
    airedEpisodes: related.type === 'show' ? (related.item.aired_episodes ?? undefined) : undefined,
    runtime: item.runtime ?? undefined,
    subgenres: item.subgenres ?? [],
  };
}
