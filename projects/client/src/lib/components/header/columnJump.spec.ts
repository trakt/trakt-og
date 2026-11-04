import { describe, expect, it } from 'vitest';
import { columnJump } from './columnJump.ts';

const columns = [6, 4];

describe('columnJump', () => {
  it('should move to the same row in the other column', () => {
    expect(columnJump({ columns, highlight: 2, step: 1 })).toBe(8);
    expect(columnJump({ columns, highlight: 8, step: -1 })).toBe(2);
  });

  it("should land on the shorter column's last row", () => {
    expect(columnJump({ columns, highlight: 5, step: 1 })).toBe(9);
  });

  it('should start a column when nothing is highlighted', () => {
    expect(columnJump({ columns, highlight: -1, step: 1 })).toBe(6);
    expect(columnJump({ columns, highlight: -1, step: -1 })).toBe(0);
  });

  it('should go nowhere past the outer columns or from below them', () => {
    expect(columnJump({ columns, highlight: 1, step: -1 })).toBeNull();
    expect(columnJump({ columns, highlight: 7, step: 1 })).toBeNull();
    expect(columnJump({ columns, highlight: 12, step: 1 })).toBeNull();
  });
});
