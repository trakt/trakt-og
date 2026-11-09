import { describe, expect, it } from 'vitest';
import { readFranchiseSort } from './franchiseSort.ts';

describe('readFranchiseSort', () => {
  it('should open on Recently Watched, newest first', () => {
    expect(readFranchiseSort(undefined)).toEqual({ by: 'recent', how: 'desc' });
    expect(readFranchiseSort('nonsense/asc')).toEqual({ by: 'recent', how: 'desc' });
  });

  it('should read the sort and direction in the URL', () => {
    expect(readFranchiseSort('percent/asc')).toEqual({ by: 'percent', how: 'asc' });
  });

  it('should give a sort without a direction its own', () => {
    expect(readFranchiseSort('left')).toEqual({ by: 'left', how: 'asc' });
    expect(readFranchiseSort('percent/sideways')).toEqual({ by: 'percent', how: 'desc' });
  });
});
