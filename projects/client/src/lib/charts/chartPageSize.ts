import type { ChartName } from './chartNames.ts';

/** A chart page's opening cards and its grid. */
export type ChartPageSize = { readonly podium: number; readonly grid: number };

/**
 * A chart page's size. Page 1 opens with larger cards: on trending #1 as the hero and #2 and #3 side by side, on the
 * other charts #1 and #2 side by side. Every page has a grid of 36, which splits evenly into 1, 2, 3 or 4 columns.
 */
export function chartPageSize(chart: ChartName): ChartPageSize {
  return { podium: chart === 'trending' ? 3 : 2, grid: 36 };
}
