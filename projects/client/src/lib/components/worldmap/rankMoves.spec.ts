import { describe, expect, it } from 'vitest';
import { rankMoves } from './rankMoves.ts';

describe('rankMoves', () => {
  it('should count places climbed and fallen', () => {
    expect(rankMoves(['US', 'GB', 'DE', 'BR'], ['US', 'DE', 'BR', 'GB'])).toEqual(
      new Map([
        ['DE', 1],
        ['BR', 1],
        ['GB', -2],
      ]),
    );
  });

  it('should leave out countries new to the ranking', () => {
    expect(rankMoves(['US'], ['FR', 'US'])).toEqual(new Map([['US', -1]]));
  });
});
