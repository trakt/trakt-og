import type { toSeasonSummary } from '../../shows/toSeasonSummary.ts';
import { toSeoDescription } from '../toSeoDescription.ts';
import { toShareImageUrl } from '../toShareImageUrl.ts';
import { compact } from './compact.ts';
import type { JsonLd } from './JsonLd.ts';
import { toAbsoluteUrl } from './toAbsoluteUrl.ts';
import { toAggregateRating } from './toAggregateRating.ts';

type SeasonJsonLdSource = Pick<
  ReturnType<typeof toSeasonSummary>,
  'title' | 'number' | 'href' | 'overview' | 'poster' | 'rating' | 'showTitle' | 'showHref'
> & { readonly episodes: readonly unknown[] };

/** A season as schema.org's `TVSeason`, part of its `TVSeries`. */
export function toSeasonJsonLd(season: SeasonJsonLdSource): JsonLd {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'TVSeason',
    name: season.title,
    description: toSeoDescription(season.overview),
    url: toAbsoluteUrl(season.href),
    image: season.poster && toShareImageUrl(season.poster),
    seasonNumber: season.number,
    numberOfEpisodes: season.episodes.length || undefined,
    partOfSeries: { '@type': 'TVSeries', name: season.showTitle, url: toAbsoluteUrl(season.showHref) },
    aggregateRating: toAggregateRating(season.rating),
  });
}
