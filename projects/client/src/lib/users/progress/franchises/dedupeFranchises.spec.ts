import { describe, expect, it } from 'vitest';
import { dedupeFranchises } from './dedupeFranchises.ts';
import type { Franchise } from './Franchise.ts';

const franchise = (id: number, movieIds: number[], likeCount: number): Franchise => ({
  id,
  slug: `f${id}-collection`,
  name: `F${id}`,
  movieIds,
  likeCount,
});
const ids = (list: readonly Franchise[]) => list.map(({ id }) => id);

describe('dedupeFranchises', () => {
  it('should keep the most liked of lists with the same movies', () => {
    const result = dedupeFranchises([franchise(1, [10, 11], 3), franchise(2, [10, 11], 9), franchise(3, [10, 11], 5)]);

    expect(ids(result)).toEqual([2]);
  });

  it('should treat the same movies in another order as the same set', () => {
    expect(ids(dedupeFranchises([franchise(1, [11, 10], 1), franchise(2, [10, 11], 2)]))).toEqual([2]);
  });

  it('should keep the lowest list id on a tie', () => {
    expect(ids(dedupeFranchises([franchise(7, [1, 2], 4), franchise(3, [2, 1], 4), franchise(5, [1, 2], 4)]))).toEqual([
      3,
    ]);
  });

  it('should keep a superset or subset as its own franchise', () => {
    const result = dedupeFranchises([
      franchise(1, [1, 2], 1),
      franchise(2, [1, 2, 3, 4], 1),
      franchise(3, [1, 2, 3], 1),
    ]);

    expect(ids(result)).toEqual([1, 2, 3]);
  });

  it('should keep the catalog order of what stays', () => {
    const result = dedupeFranchises([franchise(1, [1, 2], 1), franchise(2, [5, 6], 1), franchise(3, [1, 2], 8)]);

    expect(ids(result)).toEqual([2, 3]);
  });
});
