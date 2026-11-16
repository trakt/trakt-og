import { countryName } from '../components/summary/names.ts';
import { uniqueBy } from '../utils/uniqueBy.ts';
import { certificationAge } from './certificationAge.ts';
import type { CountryCertification } from './CountryCertification.ts';

export type CountryRating = {
  readonly code: string;
  readonly name: string;
  readonly certification: string;
  readonly original: boolean;
};

export type CertificationGroup = {
  /** The youngest age, 0 for all ages; null for ratings that don't say one. */
  readonly age: number | null;
  readonly label: string;
  readonly original: boolean;
  readonly countries: readonly CountryRating[];
};

export type FeaturedRating = CountryRating & { readonly tags: readonly ('Original Country' | 'Your Country')[] };

type Params = {
  certifications: readonly CountryCertification[];
  /** The title's origin country code, from its summary. */
  origin: string | null;
  /** A signed-in viewer's country, from their settings. */
  viewer: string | null;
};

const labelOf = (age: number | null) => (age === null ? 'Other' : age === 0 ? 'All Ages' : `${age}+`);

/**
 * Every country's rating grouped by the youngest age it allows, youngest first, with ratings that name no age last.
 * The origin country and the viewer's lead on their own too, as one entry when they're the same country.
 */
export function toCertificationGroups({ certifications, origin, viewer }: Params) {
  const code = origin?.toLowerCase() ?? null;
  const yours = viewer?.toLowerCase() ?? null;
  const rated = uniqueBy(certifications, ({ country }) => country.toLowerCase())
    .map(({ country, certification }) => ({
      age: certificationAge({ country, certification }),
      rating: {
        code: country.toLowerCase(),
        name: countryName(country),
        certification,
        original: country.toLowerCase() === code,
      },
    }))
    .toSorted((a, b) => a.rating.name.localeCompare(b.rating.name));
  const ages = [...new Set(rated.map(({ age }) => age))].toSorted((a, b) => (a ?? Infinity) - (b ?? Infinity));
  const groups: readonly CertificationGroup[] = ages.map((age) => {
    const countries = rated.filter((entry) => entry.age === age).map(({ rating }) => rating);
    return { age, label: labelOf(age), original: countries.some(({ original }) => original), countries };
  });
  const tagsOf = ({ code: country }: CountryRating) => [
    ...(country === code ? (['Original Country'] as const) : []),
    ...(country === yours ? (['Your Country'] as const) : []),
  ];
  const featured: readonly FeaturedRating[] = rated
    .map(({ rating }) => ({ ...rating, tags: tagsOf(rating) }))
    .filter(({ tags }) => tags.length > 0)
    .toSorted((a, b) => Number(b.original) - Number(a.original));
  return {
    featured,
    groups,
    count: rated.length,
  };
}
