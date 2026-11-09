import type { z } from 'zod/v4';
import { mediaImage } from '../images/mediaImage.ts';
import { genreLabel } from '../utils/genreLabel.ts';
import type { Recommendation } from './Recommendation.ts';
import type { recommendationsSchema } from './recommendationsSchema.ts';
import { toRecommendationWhy } from './toRecommendationWhy.ts';

type Row = z.infer<typeof recommendationsSchema>[number];

const pathOf = (type: 'show' | 'movie', ids: { trakt: number; slug?: string | null }) =>
  `/${type}s/${ids.slug ?? ids.trakt}`;

function toColors(colors: readonly string[] | null | undefined): readonly [string, string] | undefined {
  const [first, second] = colors ?? [];
  return first ? [first, second ?? first] : undefined;
}

/** One recommendations row as the spotlight shows it, or null when it carries neither a show nor a movie. */
export function toRecommendation(row: Row, now: Date): Recommendation | null {
  const media = row.show ?? row.movie;
  if (!media) return null;
  const type = row.show ? 'show' : 'movie';
  const releaseDate = type === 'show' ? media.first_aired : media.released;

  return {
    type,
    id: media.ids.trakt,
    path: `/${type}s/${media.ids.trakt}`,
    href: pathOf(type, media.ids),
    title: media.title,
    year: media.year ?? undefined,
    overview: media.overview ?? undefined,
    released: releaseDate ? new Date(releaseDate) <= now : false,
    rating: media.rating ?? undefined,
    runtime: media.runtime ?? undefined,
    airedEpisodes: media.aired_episodes ?? undefined,
    certification: media.certification ?? undefined,
    genres: (media.genres ?? []).slice(0, 3).map(genreLabel),
    network: type === 'show' ? (media.network ?? undefined) : undefined,
    poster: mediaImage({ type, id: media.ids.trakt, slot: 'poster', size: 'medium' }),
    fanart: mediaImage({ type, id: media.ids.trakt, slot: 'fanart', size: 'medium' }),
    colors: toColors(media.colors?.poster),
    why: toRecommendationWhy({ sources: row.sources ?? [] }),
  };
}
