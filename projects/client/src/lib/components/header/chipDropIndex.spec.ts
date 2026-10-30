import { describe, expect, it } from 'vitest';
import { chipDropIndex } from './chipDropIndex.ts';

// Three chips on one row, 100, 40 and 100 wide, then one on the next row.
const boxes = [
  { top: 0, bottom: 34, left: 0, right: 100 },
  { top: 0, bottom: 34, left: 100, right: 140 },
  { top: 0, bottom: 34, left: 140, right: 240 },
  { top: 44, bottom: 78, left: 0, right: 80 },
];

describe('chipDropIndex', () => {
  it('should stay put over its own chip or between chips', () => {
    expect(chipDropIndex({ boxes, from: 0, x: 50, y: 10 })).toBeNull();
    expect(chipDropIndex({ boxes, from: 0, x: 300, y: 10 })).toBeNull();
  });

  describe('for a drag to the right', () => {
    it('should move once past the next chip’s middle', () => {
      expect(chipDropIndex({ boxes, from: 1, x: 170, y: 10 })).toBeNull();
      expect(chipDropIndex({ boxes, from: 1, x: 200, y: 10 })).toBe(2);
    });
  });

  describe('for a drag to the left', () => {
    it('should move once past the previous chip’s middle', () => {
      expect(chipDropIndex({ boxes, from: 1, x: 70, y: 10 })).toBeNull();
      expect(chipDropIndex({ boxes, from: 1, x: 30, y: 10 })).toBe(0);
    });
  });

  it('should move onto another row at once', () => {
    expect(chipDropIndex({ boxes, from: 0, x: 10, y: 60 })).toBe(3);
  });

  it('should ignore a chip it does not have', () => {
    expect(chipDropIndex({ boxes, from: 9, x: 10, y: 10 })).toBeNull();
  });
});
