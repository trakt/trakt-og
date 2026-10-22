import { describe, expect, it } from 'vitest';
import { chartPageRequests } from './chartPageRequests.ts';

const trending = { podium: 3, grid: 36 };
const others = { podium: 2, grid: 36 };

// The chart's rows each request covers, after its skip, as [first, last] counting from 1.
const covered = (page: number, size = trending) =>
  chartPageRequests(page, size).map(({ page, limit, skip }) => [(page - 1) * limit + skip + 1, page * limit]);

describe('chartPageRequests', () => {
  it('should fetch the opening cards and a grid as one page', () => {
    expect(chartPageRequests(1, trending)).toEqual([{ page: 1, limit: 39, skip: 0 }]);
    expect(chartPageRequests(1, others)).toEqual([{ page: 1, limit: 38, skip: 0 }]);
  });

  it('should start page 2 right after page 1', () => {
    expect(covered(2)).toEqual([[40, 72], [73, 75]]);
    expect(covered(2, others)).toEqual([[39, 72], [73, 74]]);
  });

  it('should leave no gap or overlap between pages', () => {
    for (const size of [trending, others]) {
      const lasts = [1, 2, 3, 4].map((page) => covered(page, size).at(-1)?.at(1));
      const firsts = [2, 3, 4, 5].map((page) => covered(page, size).at(0)?.at(0));

      expect(firsts).toEqual(lasts.map((last) => (last ?? 0) + 1));
    }
  });

  it('should give every later page 36 rows', () => {
    const rows = (page: number, size: typeof trending) =>
      covered(page, size).reduce((sum, [first = 0, last = 0]) => sum + last - first + 1, 0);

    expect([2, 3, 10].map((page) => rows(page, trending))).toEqual([36, 36, 36]);
    expect([2, 3, 10].map((page) => rows(page, others))).toEqual([36, 36, 36]);
  });
});
