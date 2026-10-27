// FIXME(zod-4): see noteRowsSchema.ts. og has one zod, the one @trakt/api depends on.
import { z } from 'zod/v4';
import type { ListFilterKey } from './advancedFilters.ts';

/** One choice in a filter's list. `tag` is the small right-hand label OG's Chosen lists showed (a country, "Free"). */
export type FilterOption = {
  readonly value: string;
  readonly label: string;
  readonly tag?: string;
  readonly avatar?: string;
};

/** A labelled run of options: watch now's "Bundles" and "Streaming Services". */
export type FilterOptionGroup = { readonly label?: string; readonly options: readonly FilterOption[] };

// Networks come from the API (`X-Runtime`), so the body is parsed here.
const networks = z.array(z.object({ name: z.string(), country: z.string().nullish() }));

/**
 * Networks by name, since the API filters by name. Networks sharing a name ("HBO" in two countries, "Netflix" and
 * "NETFLIX") match the same shows, so they list once, as the first one.
 */
export function toNetworkOptions(body: unknown): FilterOption[] {
  const rows = networks
    .parse(body)
    .map(({ name, country }) => ({ name: name.trim(), country }))
    .filter(({ name }) => name !== '');
  const byName = new Map(rows.toReversed().map((row) => [row.name.toLowerCase(), row]));

  return [...byName.values()]
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
    .map(({ name, country }) => ({ value: name, label: name, ...(country && { tag: country.toUpperCase() }) }));
}

/** Every status a show can have (`Show.status_list` in OG), in the order a show moves through them. */
export const statusOptions: readonly FilterOption[] = [
  'returning series',
  'continuing',
  'in production',
  'planned',
  'upcoming',
  'pilot',
  'canceled',
  'ended',
].map((value) => ({ value, label: value.replace(/\b\w/g, (letter) => letter.toUpperCase()) }));

/** The lists og loads from the API. The rest ship with it. */
export type FetchedFilterKey = Exclude<
  ListFilterKey,
  'status' | 'episode_types' | 'certifications' | 'genres' | 'languages' | 'countries'
>;

/** Where each fetched list's options come from. */
export const optionPaths: Record<FetchedFilterKey, (type: 'shows' | 'movies') => string> = {
  networks: () => '/networks',
};

export const optionMappers: Record<FetchedFilterKey, (body: unknown) => FilterOption[]> = {
  networks: toNetworkOptions,
};
