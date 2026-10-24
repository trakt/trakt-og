import placeCountries from './placeCountries.json' with { type: 'json' };

const PLACES: Readonly<Record<string, string>> = placeCountries;

const US_STATES = new Set(
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(
    ' ',
  ),
);

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// GeoNames calls some regions "Land Berlin" or "State of Ohio"; people type them both ways.
const withoutPrefix = (place: string) => place.replace(/^(land|state of|province of|provincia de|estado de) /, '');

/**
 * A profile's free-text location ("Nottingham, United Kingdom", "Berlin, Land Berlin", "Austin, TX") as an ISO country
 * code, or null when no part of it names a country or a region. The last part wins, since people write the widest
 * place last; a US state's two-letter code counts only after a comma.
 */
export function countryOfLocation(location: string | null | undefined): string | null {
  const parts = (location ?? '')
    .split(/[,/|·]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .toReversed();
  if (parts.length > 1 && US_STATES.has(parts.at(0) ?? '')) return 'US';

  const codes = parts.map(normalize).flatMap((part) => [PLACES[part], PLACES[withoutPrefix(part)]]);
  return codes.find((code) => code !== undefined) ?? null;
}
