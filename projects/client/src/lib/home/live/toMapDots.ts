/** `worldDots.json`: a dot grid where every dot is a grid cell and the index of its country's code. */
export type WorldDots = {
  readonly width: number;
  readonly height: number;
  readonly step: number;
  readonly codes: readonly string[];
  /** Flat `[column, row, code index, …]`. */
  readonly dots: readonly number[];
};

export type MapDot = { readonly x: number; readonly y: number; readonly code: string };

/** The dots at their centers in map units, and a lookup from a point on the map to the country under it. */
export function toMapDots({ step, codes, dots }: WorldDots) {
  const list: MapDot[] = Array.from({ length: dots.length / 3 }, (_, i) => ({
    x: (dots[i * 3] ?? 0) * step + step / 2,
    y: (dots[i * 3 + 1] ?? 0) * step + step / 2,
    code: codes[dots[i * 3 + 2] ?? 0] ?? '',
  }));
  const cells = new Map(list.map((dot) => [`${Math.floor(dot.x / step)},${Math.floor(dot.y / step)}`, dot]));

  return {
    dots: list,
    /** The dot under a point, in map units. */
    at: (x: number, y: number) => cells.get(`${Math.floor(x / step)},${Math.floor(y / step)}`),
    /** A country's first dot, to point its tooltip at. */
    first: (code: string) => list.find((dot) => dot.code === code),
  };
}
