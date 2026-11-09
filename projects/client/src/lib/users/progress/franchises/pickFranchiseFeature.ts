import type { FranchiseFeature } from './FranchiseFeature.ts';
import type { FranchiseRow } from './FranchiseRow.ts';

/**
 * The movie a franchise's right card and grid card feature, from its movies in release order: the first released one
 * you haven't watched (up next), else the earliest one not out yet (caught up, with the date it comes), else the
 * latest released (caught up).
 */
export function pickFranchiseFeature(movies: FranchiseRow['movies']): FranchiseFeature | undefined {
  const upNext = movies.find(({ released, watched }) => released && !watched);
  if (upNext) return { kind: 'up-next', movie: upNext, tag: { text: 'Up next', kind: 'primary' } };

  const soon = movies.find(({ released }) => !released);
  if (soon) return { kind: 'soon', movie: soon, next: soon.releaseDate };

  const latest = movies.at(-1);
  return latest && { kind: 'caught-up', movie: latest };
}
