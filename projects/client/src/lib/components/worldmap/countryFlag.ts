import { flagCountries } from '#lib/components/table/flagCountries.ts';

const flags: ReadonlySet<string> = new Set(flagCountries);

/** A country's flag under `/flags`, or undefined for a code og has no flag for. */
export const countryFlag = (code: string) =>
  flags.has(code.toLowerCase()) ? `/flags/${code.toLowerCase()}.svg` : undefined;
