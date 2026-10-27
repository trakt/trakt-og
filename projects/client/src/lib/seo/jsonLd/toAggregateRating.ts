import type { JsonLd } from './JsonLd.ts';

/** Fewer votes than this and a single 10/10 would show stars in search results. */
const MIN_VOTES = 25;

/** A title's Trakt rating on a 10-point scale, once enough members voted. */
export function toAggregateRating(rating: { readonly value: number; readonly votes: number } | undefined) {
  if (!rating || rating.votes < MIN_VOTES || rating.value <= 0) return undefined;
  return {
    '@type': 'AggregateRating',
    ratingValue: Math.round(rating.value * 10) / 10,
    bestRating: 10,
    worstRating: 1,
    ratingCount: rating.votes,
  } satisfies JsonLd;
}
