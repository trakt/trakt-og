import { describe, expect, it } from 'vitest';
import { ratingPercent } from './ratingPercent.ts';

describe('util: ratingPercent', () => {
  it('should truncate, not round', () => {
    expect([7.99, 8, 0, 10, 6.04].map(ratingPercent)).toEqual([79, 80, 0, 100, 60]);
  });
});
