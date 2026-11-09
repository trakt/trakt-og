import { describe, expect, it } from 'vitest';
import type { FranchiseProgress } from './FranchiseProgress.ts';
import { sortFranchises } from './sortFranchises.ts';

const item = (id: number, name: string, watched: number, total: number, lastAt: string): FranchiseProgress => ({
  franchise: { id, slug: `${name}-collection`, name, movieIds: [], likeCount: 0 },
  watched,
  total,
  lastAt,
});

const items = [
  item(1, 'Alien', 2, 4, '2026-03-01T00:00:00.000Z'),
  item(2, 'Batman', 3, 3, '2026-05-01T00:00:00.000Z'),
  item(3, 'Cars', 1, 6, '2026-04-01T00:00:00.000Z'),
];
const names = (sorted: readonly FranchiseProgress[]) => sorted.map(({ franchise }) => franchise.name);

describe('sortFranchises', () => {
  it('should put the latest play first for Recently Watched', () => {
    expect(names(sortFranchises(items, { by: 'recent', how: 'desc' }))).toEqual(['Batman', 'Cars', 'Alien']);
  });

  it('should order by the share watched', () => {
    expect(names(sortFranchises(items, { by: 'percent', how: 'desc' }))).toEqual(['Batman', 'Alien', 'Cars']);
  });

  it('should order by movies left, fewest first', () => {
    expect(names(sortFranchises(items, { by: 'left', how: 'asc' }))).toEqual(['Batman', 'Alien', 'Cars']);
  });

  it('should order by title in either direction', () => {
    expect(names(sortFranchises(items, { by: 'title', how: 'asc' }))).toEqual(['Alien', 'Batman', 'Cars']);
    expect(names(sortFranchises(items, { by: 'title', how: 'desc' }))).toEqual(['Cars', 'Batman', 'Alien']);
  });

  it('should break a tie by title', () => {
    const tied = [item(1, 'Zed', 1, 2, 'x'), item(2, 'Abe', 1, 2, 'x')];

    expect(names(sortFranchises(tied, { by: 'percent', how: 'desc' }))).toEqual(['Abe', 'Zed']);
  });
});
