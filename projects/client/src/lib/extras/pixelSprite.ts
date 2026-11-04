/** One run of same-colored pixels along a sprite row. */
export interface PixelRun {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  /** The row's character for it, which picks its color. */
  readonly key: string;
}

/** A sprite drawn as rows of characters ('.' is empty), as runs of same-colored pixels, so it takes few SVG rects. */
export function pixelSprite(rows: readonly string[]): readonly PixelRun[] {
  const runs: PixelRun[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row.charAt(x);
      let end = x + 1;
      while (row.charAt(end) === key) end += 1;
      if (key !== '.') runs.push({ x, y, width: end - x, key });
      x = end;
    }
  });
  return runs;
}
