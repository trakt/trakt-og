import type { CountryCertification } from './CountryCertification.ts';

interface Release {
  readonly country: string;
  readonly certification?: string | null;
  readonly release_type?: string;
}

/** A movie's rating in each country from its releases: the theatrical one's, else the first rated release's. */
export function releaseCertifications(releases: readonly Release[]): readonly CountryCertification[] {
  const countries = [...new Set(releases.map(({ country }) => country))];
  return countries.flatMap((country) => {
    const rated = releases.filter((release) => release.country === country && release.certification);
    const pick = rated.find(({ release_type }) => release_type === 'theatrical') ?? rated.at(0);
    return pick?.certification ? [{ country, certification: pick.certification }] : [];
  });
}
