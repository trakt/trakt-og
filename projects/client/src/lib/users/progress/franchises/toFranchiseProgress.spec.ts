import { describe, expect, it } from 'vitest';
import type { Franchise } from './Franchise.ts';
import { toFranchiseProgress } from './toFranchiseProgress.ts';

const franchise = (id: number, movieIds: number[]): Franchise => ({
  id,
  slug: `f${id}-collection`,
  name: `F${id}`,
  movieIds,
  likeCount: 0,
});

describe('toFranchiseProgress', () => {
  const plays = new Map([
    [1, ['2026-01-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z']],
    [2, ['2026-02-01T00:00:00.000Z']],
    [9, ['2026-05-01T00:00:00.000Z']],
  ]);

  it('should count the watched movies and find the latest play', () => {
    const [started] = toFranchiseProgress({ franchises: [franchise(1, [1, 2, 3, 4])], plays });

    expect(started).toMatchObject({ watched: 2, total: 4, lastAt: '2026-03-01T00:00:00.000Z' });
  });

  it('should leave out a franchise with nothing watched', () => {
    expect(toFranchiseProgress({ franchises: [franchise(2, [5, 6])], plays })).toEqual([]);
  });

  it('should count a rewatched movie once', () => {
    const [started] = toFranchiseProgress({ franchises: [franchise(1, [1, 3])], plays });

    expect(started?.watched).toBe(1);
  });
});
