import type { ChartPageSize } from './chartPageSize.ts';

/** One API page to fetch for a chart page, and how many of its rows the chart page starts after. */
export type ChartPageRequest = { readonly page: number; readonly limit: number; readonly skip: number };

/**
 * The API pages behind one chart page. Page 1 is the opening cards and a grid in one request. Every later page starts
 * the opening's count of rows into the API's own page of a grid, so it takes that page from there and the rows after
 * it, which are one API page of the opening's size. The grid is a multiple of the opening, so the pages line up.
 */
export function chartPageRequests(page: number, { podium, grid }: ChartPageSize): readonly ChartPageRequest[] {
  if (page <= 1) return [{ page: 1, limit: podium + grid, skip: 0 }];

  return [
    { page, limit: grid, skip: podium },
    { page: (grid * page) / podium + 1, limit: podium, skip: 0 },
  ];
}
