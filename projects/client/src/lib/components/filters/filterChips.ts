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
 * A sidebar's Applied Filters, as chips, one per filter: watch now first (its bundles and services by name), then
 * every other filter. Their count is how many filters are on.
 */
export function filterChips({ filters, sources, country, favorites }: FilterChipsParams): FilterTag[] {
  const tiles = watchNowTiles({ watchnow: filters.watchnow, sources, country, favorites });
  // The chip's label already says Streaming, so a bundle drops it: "Streaming Free" is Free.
  const values = tiles.map((tile) => ({
    text: tile.kind === 'bundle' ? tile.name.replace(/^Streaming /, '') : tile.source.name,
    without: false,
  }));
  return [...(values.length > 0 ? [{ id: 'watchnow', values }] : []), ...filterTags(filters)];
}
