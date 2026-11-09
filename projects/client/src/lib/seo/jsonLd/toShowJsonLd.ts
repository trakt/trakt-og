import type { toShowSummary } from '../../shows/toShowSummary.ts';
import { toSeoDescription } from '../toSeoDescription.ts';
import { compact } from './compact.ts';
import type { JsonLd } from './JsonLd.ts';
import { toAbsoluteUrl } from './toAbsoluteUrl.ts';
import { toAggregateRating } from './toAggregateRating.ts';
import { toIsoDate } from './toIsoDate.ts';
import { toSameAs } from './toSameAs.ts';

type Summary = ReturnType<typeof toShowSummary>;

type ShowJsonLdSource = Pick<
  Summary,
  | 'title'
  | 'href'
  | 'overview'
  | 'structuredImage'
  | 'certification'
  | 'rating'
  | 'links'
  | 'firstAired'
  | 'airedEpisodes'
> & { readonly facts: Pick<Summary['facts'], 'genres'> };

/** A show as schema.org's `TVSeries`. */
export function toShowJsonLd(show: ShowJsonLdSource): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.title,
    description: toSeoDescription(show.overview),
    url: toAbsoluteUrl(show.href),
    image: show.structuredImage,
    genre: show.facts.genres.map(({ name }) => name),
    startDate: toIsoDate(show.firstAired),
    numberOfEpisodes: show.airedEpisodes || undefined,
    contentRating: show.certification,
    aggregateRating: toAggregateRating(show.rating),
    sameAs: toSameAs(show.links),
  });
}
