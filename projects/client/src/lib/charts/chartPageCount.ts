import type { ChartPageSize } from './chartPageSize.ts';

/** How many chart pages a chart of `itemCount` fills: page 1 holds the opening cards and a grid, the rest a grid each. */
export function chartPageCount(itemCount: number, { podium, grid }: ChartPageSize): number {
  return 1 + Math.max(0, Math.ceil((itemCount - podium - grid) / grid));
}
