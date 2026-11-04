import type { SearchRow } from './toSearchRow.ts';

/** One titled list of rows for the dropdown before anything is typed, with a link to see all of them when it has one. */
export type SearchTrendingSection = {
  readonly label: string;
  readonly rows: readonly SearchRow[];
  readonly more?: { readonly href: string; readonly label: string };
};
