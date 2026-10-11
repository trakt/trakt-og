import type { AdvancedFilters } from './advancedFilters.ts';
import { type FilterTag, filterTags } from './filterTags.ts';
import { type FilterSource, watchNowTiles } from './watchNowFilter.ts';

type FilterChipsParams = {
  filters: AdvancedFilters;
  /** The picked services, which the loader fetched. */
  sources: ReadonlyMap<string, FilterSource>;
  /** The viewer's watch-now country and favorite services there. */
  country: string;
  favorites: readonly string[];
};

/**
 * A sidebar's Applied Filters, as chips: the watch-now bundles and services first (a service by its name), then every
 * other filter. Their count is how many filters are on.
 */
export function filterChips({ filters, sources, country, favorites }: FilterChipsParams): FilterTag[] {
  const tiles = watchNowTiles({ watchnow: filters.watchnow, sources, country, favorites });
  return [
    ...tiles.map((tile) => ({
      id: `watchnow-${tile.id}`,
      text: tile.kind === 'bundle' ? tile.name : tile.source.name,
      without: false,
    })),
    ...filterTags(filters),
  ];
}
