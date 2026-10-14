import type { GifEntry } from './GifEntry.ts';

/**
 * Spreads GIFs over `count` columns, always appending to the shortest. Unlike CSS `columns`, another page never
 * reshuffles what's already on screen.
 */
export function toGifColumns(gifs: readonly GifEntry[], count: number): GifEntry[][] {
  if (count < 1) return [];

  const columns: GifEntry[][] = Array.from({ length: count }, () => []);
  const heights: number[] = Array.from({ length: count }, () => 0);
  for (const gif of gifs) {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest]?.push(gif);
    heights[shortest] = (heights[shortest] ?? 0) + gif.preview.height / gif.preview.width;
  }
  return columns;
}
