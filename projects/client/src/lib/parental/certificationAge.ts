/** Ratings with no number in them, by country, as the youngest age they're meant for. */
const NAMED: Readonly<Record<string, number>> = {
  'us:g': 0,
  'us:tv-y': 0,
  'us:tv-g': 0,
  'us:r': 17,
  'us:tv-ma': 17,
  'us:nc-17': 18,
  'gb:u': 0,
  'au:m': 15,
  'nz:m': 16,
  'ca:r': 18,
  'in:u': 0,
  'in:ua': 12,
  'in:a': 18,
  'hk:i': 0,
  'hk:iib': 15,
  'hk:iii': 18,
  'es:a': 0,
  'it:t': 0,
};

/** Words that mean any age, wherever they're used: G, U, L (Livre), AL (Alle leeftijden), TP (Tous publics). */
const ALL_AGES: ReadonlySet<string> = new Set(['g', 'u', 'l', 'al', 'all', 'tp', 'apta']);

const OLDEST = 21;

/**
 * The youngest age a country's rating is meant for: "MA 15+" is 15, "-12" is 12, "TV-MA" is 17, "G" is 0. Null when
 * the rating doesn't say (PG, Not Rated), so it can't be placed.
 */
export function certificationAge({ country, certification }: { country: string; certification: string }) {
  const rating = certification.trim().toLowerCase();
  const named = NAMED[`${country.toLowerCase()}:${rating}`];
  if (named !== undefined) return named;
  const number = Number(rating.match(/\d+/)?.at(0));
  if (Number.isInteger(number) && number <= OLDEST) return number;
  return ALL_AGES.has(rating) ? 0 : null;
}
