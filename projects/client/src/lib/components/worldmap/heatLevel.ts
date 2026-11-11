/**
 * The map's five shades and the smallest share of everyone on the map each one starts at. At a typical sample of
 * about 3,300 people they fall where 1, 5, 20, 60 and 150 people used to.
 */
const HEAT_STEPS = [0, 0.0015, 0.006, 0.02, 0.05] as const;

/** How dark a country's dots are: 0 with nobody watching, then 1 to 5 by `HEAT_STEPS`. */
export function heatLevel(share: number): number {
  if (share <= 0) return 0;
  return HEAT_STEPS.filter((step) => share >= step).length;
}
