import type { ListsMode } from './ListsMode.ts';
import { listSorts } from './listSorts.ts';

const [rank, updated, title, likes, comments, items, random, liked] = listSorts;
const shared = [updated, title, likes, comments, items, random] as const;

/**
 * The sort menu for a lists index, its default first. Rank is the owner's order, so only their personal lists have it;
 * Liked Date leads on liked lists and is only there.
 */
export function sortsFor(mode: ListsMode) {
  if (mode === 'personal') return [rank, ...shared] as const;
  if (mode === 'collaborations') return shared;
  return [liked, ...shared] as const;
}
