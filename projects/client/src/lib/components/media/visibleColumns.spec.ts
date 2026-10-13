import { describe, expect, it } from 'vitest';
import { visibleColumns } from './visibleColumns.ts';

describe('visibleColumns', () => {
  it("should match PosterGrid's columns at each width", () => {
    expect(visibleColumns(1140, 6)).toBe(6);
    expect(visibleColumns(940, 6)).toBe(6);
    expect(visibleColumns(720, 6)).toBe(4);
    expect(visibleColumns(719, 6)).toBe(2);
    expect(visibleColumns(719, 3, 1)).toBe(1);
    expect(visibleColumns(800, 3)).toBe(3);
  });

  it('should keep the desktop columns before the grid is measured', () => {
    expect(visibleColumns(0, 6)).toBe(6);
  });
});
