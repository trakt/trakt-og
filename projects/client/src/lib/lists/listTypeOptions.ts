import type { ListItemType } from './listItemSorts.ts';
import type { ListKind } from './ListKind.ts';

const types: Readonly<Record<ListItemType, string>> = {
  movie: 'Movies',
  show: 'Shows',
  season: 'Seasons',
  episode: 'Episodes',
  person: 'People',
};

/**
 * The type dropdown after All Types: favorites hold movies and shows, and every other list movies, shows, seasons and
 * episodes. No list takes people, so People is never offered.
 */
export function listTypeOptions(kind: ListKind): readonly { readonly type: ListItemType; readonly label: string }[] {
  const allowed: readonly ListItemType[] = kind === 'favorites'
    ? ['movie', 'show']
    : ['movie', 'show', 'season', 'episode'];
  return allowed.map((type) => ({ type, label: types[type] }));
}
