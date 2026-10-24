import { describe, expect, it } from 'vitest';
import type { GifEntry } from './GifEntry.ts';
import { toGifColumns } from './toGifColumns.ts';

const gif = (id: string, width: number, height: number): GifEntry => ({
  id,
  slug: id,
  title: id,
  preview: { url: `https://static.klipy.com/${id}.webp`, width, height },
  full: { url: `https://static.klipy.com/${id}.gif`, width, height },
});
const ids = (columns: GifEntry[][]) => columns.map((column) => column.map((entry) => entry.id));

describe('toGifColumns', () => {
  it('should spread square GIFs round robin', () => {
    const columns = toGifColumns(
      ['a', 'b', 'c', 'd', 'e'].map((id) => gif(id, 100, 100)),
      2,
    );
    expect(ids(columns)).toEqual([
      ['a', 'c', 'e'],
      ['b', 'd'],
    ]);
  });

  it('should always append to the shortest column', () => {
    // `tall` is three times the height of `short`, so the second column keeps taking GIFs until it catches up.
    const columns = toGifColumns([gif('tall', 100, 300), gif('short', 100, 50), gif('next', 100, 50)], 2);
    expect(ids(columns)).toEqual([['tall'], ['short', 'next']]);
  });

  it('should return no columns when asked for none, and empty ones for no GIFs', () => {
    expect(toGifColumns([gif('a', 100, 100)], 0)).toEqual([]);
    expect(toGifColumns([], 3)).toEqual([[], [], []]);
  });
});
