import { describe, expect, it } from 'vitest';
import { moveItem } from './moveItem.ts';

describe('util: moveItem', () => {
  const items = ['a', 'b', 'c', 'd'];

  it('should move an item later', () => {
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('should move an item earlier', () => {
    expect(moveItem(items, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('should move an item to the end', () => {
    expect(moveItem(items, 1, 3)).toEqual(['a', 'c', 'd', 'b']);
  });

  it('should leave the items alone for an index out of range', () => {
    expect(moveItem(items, 0, 4)).toEqual(items);
    expect(moveItem(items, -1, 2)).toEqual(items);
  });

  it('should not change the original', () => {
    moveItem(items, 0, 3);
    expect(items).toEqual(['a', 'b', 'c', 'd']);
  });
});
