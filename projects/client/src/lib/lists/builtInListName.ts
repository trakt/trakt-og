import type { BuiltInListKind } from './toBuiltInListView.ts';

/** The classic name of the watchlist or favorites, which the API has no list object for. */
export function builtInListName(kind: BuiltInListKind): string {
  return kind === 'watchlist' ? 'Watchlist' : 'Favorites';
}
