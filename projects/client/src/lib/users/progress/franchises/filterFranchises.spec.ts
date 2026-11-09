import { describe, expect, it } from 'vitest';
import { filterFranchises } from './filterFranchises.ts';
import type { FranchiseProgress } from './FranchiseProgress.ts';

const item = (name: string, watched: number, total: number): FranchiseProgress => ({
  franchise: { id: 1, slug: 'x-collection', name, movieIds: [], likeCount: 0 },
  watched,
  total,
  lastAt: '2026-01-01T00:00:00.000Z',
});
const items = [item('Alien Collection', 4, 4), item('Batman Collection', 2, 4)];

describe('filterFranchises', () => {
  it('should hide the completed franchises', () => {
    expect(filterFranchises(items, { hide: ['completed'] }).map(({ franchise }) => franchise.name)).toEqual([
      'Batman Collection',
    ]);
  });

  it('should hide the franchises not completed', () => {
    expect(filterFranchises(items, { hide: ['not-completed'] }).map(({ franchise }) => franchise.name)).toEqual([
      'Alien Collection',
    ]);
  });

  it('should keep them all with nothing hidden', () => {
    expect(filterFranchises(items, { hide: [] })).toHaveLength(2);
  });

  it('should search the name, ignoring case', () => {
    expect(filterFranchises(items, { hide: [], terms: ' ALIEN ' }).map(({ franchise }) => franchise.name)).toEqual([
      'Alien Collection',
    ]);
  });
});
