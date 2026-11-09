import { describe, expect, it } from 'vitest';
import { isFranchise } from './isFranchise.ts';

const movieIds = [1, 2];

describe('isFranchise', () => {
  it('should accept a collection slug with two movies', () => {
    expect(isFranchise({ slug: 'star-wars-collection', movieIds })).toBe(true);
  });

  it('should accept a collection followed by a qualifier', () => {
    expect(isFranchise({ slug: 'dc-collection-2', movieIds })).toBe(true);
  });

  it('should refuse a slug that only contains the word', () => {
    expect(isFranchise({ slug: 'collections-of-fear', movieIds })).toBe(false);
    expect(isFranchise({ slug: 'imdb-top-250', movieIds })).toBe(false);
  });

  it('should refuse the Criterion Collection', () => {
    expect(isFranchise({ slug: 'the-criterion-collection', movieIds })).toBe(false);
  });

  it('should need two movies', () => {
    expect(isFranchise({ slug: 'alien-collection', movieIds: [1] })).toBe(false);
    expect(isFranchise({ slug: 'alien-collection', movieIds: [] })).toBe(false);
  });
});
