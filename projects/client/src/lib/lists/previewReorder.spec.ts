import { describe, expect, it } from 'vitest';
import { previewReorder } from './previewReorder.ts';

const items = [
  { key: 'a', rank: 1 },
  { key: 'b', rank: 2 },
  { key: 'c', rank: 3 },
  { key: 'd', rank: 4 },
];

describe('util: previewReorder', () => {
  it('should move an item down and keep the ranks in order', () => {
    expect(previewReorder(items, 0, 2)).toEqual([
      { key: 'b', rank: 1 },
      { key: 'c', rank: 2 },
      { key: 'a', rank: 3 },
      { key: 'd', rank: 4 },
    ]);
  });

  it('should move an item up and keep the ranks in order', () => {
    expect(previewReorder(items, 3, 1)).toEqual([
      { key: 'a', rank: 1 },
      { key: 'd', rank: 2 },
      { key: 'b', rank: 3 },
      { key: 'c', rank: 4 },
    ]);
  });

  it('should keep the ranks a filtered page shows', () => {
    const page = [
      { key: 'a', rank: 2 },
      { key: 'b', rank: 5 },
      { key: 'c', rank: 9 },
    ];
    expect(previewReorder(page, 2, 0)).toEqual([
      { key: 'c', rank: 2 },
      { key: 'a', rank: 5 },
      { key: 'b', rank: 9 },
    ]);
  });

  it('should return the same items when nothing moves', () => {
    expect(previewReorder(items, 1, 1)).toBe(items);
  });

  it('should leave the items alone for an index out of range', () => {
    expect(previewReorder(items, 0, 7)).toEqual(items);
  });
});
