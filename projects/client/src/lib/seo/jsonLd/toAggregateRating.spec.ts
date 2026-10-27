import { describe, expect, it } from 'vitest';
import { toAggregateRating } from './toAggregateRating.ts';

describe('seo: toAggregateRating', () => {
  it('should rate on a 10-point scale with the vote count', () => {
    expect(toAggregateRating({ value: 8.7654, votes: 25 })).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 8.8,
      bestRating: 10,
      worstRating: 1,
      ratingCount: 25,
    });
  });

  it('should leave the rating out under 25 votes', () => {
    expect(toAggregateRating({ value: 10, votes: 24 })).toBeUndefined();
    expect(toAggregateRating({ value: 10, votes: 1 })).toBeUndefined();
  });

  it('should leave an unrated or unreleased title out', () => {
    expect(toAggregateRating({ value: 0, votes: 100 })).toBeUndefined();
    expect(toAggregateRating(undefined)).toBeUndefined();
  });
});
