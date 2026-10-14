import type { z } from 'zod/v4';
import { imageUrl } from '../utils/imageUrl.ts';
import type { Recommendation, RecommendationSource } from './Recommendation.ts';
import type { recommendationsSchema } from './recommendationsSchema.ts';

type Row = z.infer<typeof recommendationsSchema>[number];
type Source = NonNullable<Row['sources']>[number];

const humanize = (slug: string) => slug.replaceAll('-', ' ').replace(/^\w/, (letter) => letter.toUpperCase());

const pathOf = (type: 'show' | 'movie', ids: { trakt: number; slug?: string | null }) =>
  `/${type}s/${ids.slug ?? ids.trakt}`;

function toSource(source: Source): RecommendationSource | null {
  const media = source.show ?? source.movie;
  if (!media) return null;
  const type = source.show ? 'show' : 'movie';

  return {
    type,
    id: media.ids.trakt,
    href: pathOf(type, media.ids),
    title: media.title,
    year: media.year ?? undefined,
    poster: imageUrl(media.images?.poster?.at(0), 'thumb'),
    stars: source.stars ?? undefined,
    watched: source.type === 'activity',
    loved: source.type === 'favorite',
  };
}

// A title can come back once as watched and again as loved: it becomes one, with both and the first rating.
function merged(titles: readonly RecommendationSource[]): RecommendationSource[] {
  const byTitle = titles.reduce((all, title) => {
    const key = `${title.type}:${title.id}`;
    const seen = all.get(key);
    return all.set(
      key,
      seen
        ? {
          ...seen,
          stars: seen.stars ?? title.stars,
          watched: seen.watched || title.watched,
          loved: seen.loved || title.loved,
        }
        : title,
    );
  }, new Map<string, RecommendationSource>());
  return [...byTitle.values()];
}

function toColors(colors: readonly string[] | null | undefined): readonly [string, string] | undefined {
  const [first, second] = colors ?? [];
  return first ? [first, second ?? first] : undefined;
}

function why(sources: readonly Source[]): Recommendation['why'] {
  const titles = sources.filter((source) => source.type !== 'subgenre').flatMap((source) => toSource(source) ?? []);
  const likes = sources.flatMap((source) => source.subgenres?.map(({ name }) => name) ?? []);

  return { titles: merged(titles), likes: [...new Set(likes)] };
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
    genres: (media.genres ?? []).slice(0, 3).map(humanize),
    network: type === 'show' ? media.network ?? undefined : undefined,
    poster: imageUrl(media.images?.poster?.at(0), 'medium'),
    fanart: imageUrl(media.images?.fanart?.at(0), 'medium'),
    colors: toColors(media.colors?.poster),
    why: why(row.sources ?? []),
  };
}
