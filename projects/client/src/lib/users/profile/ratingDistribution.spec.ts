import { describe, expect, it } from 'vitest';
import { ratingDistribution } from './ratingDistribution.ts';

describe('util: ratingDistribution', () => {
  it('should count ratings 1 to 10 with missing ones as zero, and give the total and average', () => {
    expect(ratingDistribution({ '2': 1, '8': 3, '10': 4 })).toEqual({
      counts: [0, 1, 0, 0, 0, 0, 0, 3, 0, 4],
      total: 8,
      average: 8.25,
      most: 4,
      mostGiven: 10,
    });
  });

  it('should pick the highest rating on a tie for most given', () => {
    expect(ratingDistribution({ '3': 5, '6': 5, '7': 5, '1': 2 })).toMatchObject({ most: 5, mostGiven: 7 });
  });

  it('should give a zero total and average with no ratings', () => {
    expect(ratingDistribution(undefined)).toMatchObject({ total: 0, average: 0, most: 0 });
    expect(ratingDistribution({})).toMatchObject({ total: 0, average: 0, most: 0 });
  });
});
