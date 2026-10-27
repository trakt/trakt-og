import type { ratingQuery } from './ratingQuery.ts';

/** The path after `/ratings`: the type, rating and sort, leaving out the defaults that trail it. */
export function ratingsPath({ type, rating, by, how }: ReturnType<typeof ratingQuery>): string {
  if (by !== 'added' || how !== 'asc') return `/${type}/${rating}/${by}/${how}`;
  if (rating !== 'all') return `/${type}/${rating}`;
  return type === 'all' ? '' : `/${type}`;
}
