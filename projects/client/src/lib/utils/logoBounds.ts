/** A box in an image, in pixels. */
export type LogoBounds = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

type LogoBoundsParams = {
  /** RGBA bytes, four a pixel, row by row: a canvas's `ImageData.data`. */
  data: ArrayLike<number>;
  width: number;
  height: number;
  /** The alpha a pixel needs to count as drawn, out of 255, so near-invisible specks and soft halos don't. */
  threshold?: number;
};

const range = (length: number) => Array.from({ length }, (_, i) => i);

/** The box around a logo's drawn pixels, to trim its transparent margins. Undefined when nothing is drawn. */
export function logoBounds({ data, width, height, threshold = 8 }: LogoBoundsParams): LogoBounds | undefined {
  const drawn = (x: number, y: number) => (data[(y * width + x) * 4 + 3] ?? 0) > threshold;
  const rows = range(height).map((y) => range(width).some((x) => drawn(x, y)));
  const top = rows.indexOf(true);
  if (top === -1) return undefined;

  const bottom = rows.lastIndexOf(true);
  const columns = range(width).map((x) => range(bottom - top + 1).some((dy) => drawn(x, top + dy)));
  const left = columns.indexOf(true);
  const right = columns.lastIndexOf(true);

  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}
