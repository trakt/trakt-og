import { describe, expect, it } from 'vitest';
import { listSortHow, reverseHow } from './listItemSorts.ts';

describe('listSortHow', () => {
  it('should start dates, scores, votes and popularity newest or highest first', () => {
    expect(
      ['added', 'released', 'watched', 'collected', 'percentage', 'votes', 'popularity', 'my_rating'].map(listSortHow),
    )
      .toEqual(['desc', 'desc', 'desc', 'desc', 'desc', 'desc', 'desc', 'desc']);
  });

  it('should start Rank, Title, Runtime and Random first to last', () => {
    expect(['rank', 'title', 'runtime', 'random'].map(listSortHow)).toEqual(['asc', 'asc', 'asc', 'asc']);
  });

  it('should start an unknown sort ascending', () => {
    expect(listSortHow('nope')).toBe('asc');
  });
});

describe('reverseHow', () => {
  it("should flip away from the sort's own direction", () => {
    expect([reverseHow('added', false), reverseHow('added', true)]).toEqual(['desc', 'asc']);
    expect([reverseHow('title', false), reverseHow('title', true)]).toEqual(['asc', 'desc']);
  });
});
