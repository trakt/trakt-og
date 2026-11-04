const UNITS: Record<string, number> = { k: 1_000, m: 1_000_000, b: 1_000_000_000 };
const GROSS = /^Gross: \$(\d+(?:\.\d+)?)([kmb])?$/im;

/**
 * A film's total US gross, in dollars, from its box office list item's notes. The API has no field for it: the IMDb
 * import writes it into the notes as OG's readable stat ("Gross: $245.3m"), so it's as rounded as that. Null when the
 * notes have no gross.
 */
export function totalGross(notes: string | null | undefined): number | null {
  const match = notes?.match(GROSS);
  if (!match) return null;

  const [, amount = '0', unit = ''] = match;
  return Math.round(Number(amount) * (UNITS[unit.toLowerCase()] ?? 1));
}
