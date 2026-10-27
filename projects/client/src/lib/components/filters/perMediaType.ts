import type { FilterOption } from './filterOptions.ts';

type MediaType = 'shows' | 'movies';

/** `[value, label]`, or `[value, label, type]` for a choice only that media type has. */
export type MediaTypeRow = readonly [string, string, MediaType?];

/** A bundled list's choices for each media type, in the rows' order. */
export function perMediaType(rows: readonly MediaTypeRow[]): Readonly<Record<MediaType, readonly FilterOption[]>> {
  const of = (type: MediaType) =>
    rows.filter(([, , only]) => !only || only === type).map(([value, label]) => ({ value, label }));
  return { shows: of('shows'), movies: of('movies') };
}
