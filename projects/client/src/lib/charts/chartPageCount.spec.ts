import { describe, expect, it } from 'vitest';
import { chartPageCount } from './chartPageCount.ts';

const trending = { podium: 3, grid: 36 };
const others = { podium: 2, grid: 36 };

describe('chartPageCount', () => {
  it('should keep a short chart on one page', () => {
    expect([0, 1, 39].map((count) => chartPageCount(count, trending))).toEqual([1, 1, 1]);
    expect(chartPageCount(38, others)).toBe(1);
  });

  it('should add a page for every 36 after page 1', () => {
    expect([40, 75, 76, 734].map((count) => chartPageCount(count, trending))).toEqual([2, 2, 3, 21]);
    expect([39, 74, 75].map((count) => chartPageCount(count, others))).toEqual([2, 2, 3]);
  });
});
