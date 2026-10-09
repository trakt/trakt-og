import { describe, expect, it } from 'vitest';
import { releasedCounts } from './releasedCounts.ts';

const counts = [
  { count: 410_000, label: 'watchers' },
  { count: 24_400_000, label: 'plays' },
  { count: 1, label: 'list', href: '/movies/dune/lists' },
  { count: 12, label: 'favorited' },
];

describe('releasedCounts', () => {
  it('should keep every count once released', () => {
    expect(releasedCounts(counts, true)).toEqual(counts);
  });

  it('should keep only the list count before release', () => {
    expect(releasedCounts(counts, false)).toEqual([{ count: 1, label: 'list', href: '/movies/dune/lists' }]);
  });
});
