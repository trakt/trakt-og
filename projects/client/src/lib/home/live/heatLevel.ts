/** The map's five shades and the fewest watchers each one starts at. */
const HEAT_STEPS = [1, 5, 20, 60, 150] as const;

/** How dark a country's dots are: 0 with nobody watching, then 1 to 5 by `HEAT_STEPS`. */
export function heatLevel(watching: number): number {
  return HEAT_STEPS.filter((step) => watching >= step).length;
}
