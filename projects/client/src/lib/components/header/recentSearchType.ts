import { searchTypes } from './searchTypes.ts';

/**
 * The search type a saved query was made in. API stores the Shows & Movies type as `all` and official lists as
 * `official_lists`; anything it doesn't know is Shows & Movies.
 */
export function recentSearchType(slug: string | null | undefined): (typeof searchTypes)[number] {
  const mapped = slug === 'all' ? '' : slug === 'official_lists' ? 'lists' : (slug ?? '');
  return searchTypes.find((type) => type.slug === mapped) ?? searchTypes[0];
}
