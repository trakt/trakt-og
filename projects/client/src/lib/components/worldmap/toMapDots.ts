import type { MapProjection } from './MapProjection.ts';

/** `worldDots.json`: a dot grid where every dot is a grid cell and the index of its country's code. */
export type WorldDots = {
  readonly width: number;
  readonly height: number;
  readonly step: number;
  /** The Natural Earth fit that drew the grid, so a dot can be turned back into a place. */
  readonly projection: MapProjection;
  readonly codes: readonly string[];
  /** Flat `[column, row, code index, …]`. */
  readonly dots: readonly number[];
};

export type MapDot = { readonly x: number; readonly y: number; readonly code: string };

/** The dots at their centers in map units, and a lookup from a point on the map to the country under it. */
export function toMapDots({ step, codes, dots }: Pick<WorldDots, 'step' | 'codes' | 'dots'>) {
  const list: MapDot[] = Array.from({ length: dots.length / 3 }, (_, i) => ({
    x: (dots[i * 3] ?? 0) * step + step / 2,
    y: (dots[i * 3 + 1] ?? 0) * step + step / 2,
    code: codes[dots[i * 3 + 2] ?? 0] ?? '',
  }));
  const cells = new Map(list.map((dot) => [`${Math.floor(dot.x / step)},${Math.floor(dot.y / step)}`, dot]));
  const byCountry = Map.groupBy(list, (dot) => dot.code);

  return {
    dots: list,
    /** The dot under a point, in map units. */
    at: (x: number, y: number) => cells.get(`${Math.floor(x / step)},${Math.floor(y / step)}`),
    /** A country's first dot, to point its tooltip at. */
    first: (code: string) => byCountry.get(code)?.at(0),
    /** Every dot of a country, for its pings. */
    of: (code: string): readonly MapDot[] => byCountry.get(code) ?? [],
  };
}
