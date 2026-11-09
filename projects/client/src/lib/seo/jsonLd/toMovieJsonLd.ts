import type { toMovieSummary } from '../../movies/toMovieSummary.ts';
import { toSeoDescription } from '../toSeoDescription.ts';
import { compact } from './compact.ts';
import type { JsonLd } from './JsonLd.ts';
import { toAbsoluteUrl } from './toAbsoluteUrl.ts';
import { toAggregateRating } from './toAggregateRating.ts';
import { toIsoDate } from './toIsoDate.ts';
import { toIsoDuration } from './toIsoDuration.ts';
import { toSameAs } from './toSameAs.ts';

type Summary = ReturnType<typeof toMovieSummary>;

type MovieJsonLdSource = Pick<
  Summary,
  'title' | 'href' | 'overview' | 'structuredImage' | 'certification' | 'rating' | 'links'
> & { readonly facts: Pick<Summary['facts'], 'genres' | 'released' | 'runtime'> };

/** A movie as schema.org's `Movie`. */
export function toMovieJsonLd(movie: MovieJsonLdSource): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: toSeoDescription(movie.overview),
    url: toAbsoluteUrl(movie.href),
    image: movie.structuredImage,
    genre: movie.facts.genres.map(({ name }) => name),
    datePublished: toIsoDate(movie.facts.released?.date),
    duration: toIsoDuration(movie.facts.runtime),
    contentRating: movie.certification,
    aggregateRating: toAggregateRating(movie.rating),
    sameAs: toSameAs(movie.links),
  });
}
