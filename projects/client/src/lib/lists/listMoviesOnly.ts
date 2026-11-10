type ItemType = 'movie' | 'show' | 'season' | 'episode';

const FOLDER = /\/(movies|shows|seasons|episodes)\//;
const SINGULAR: Readonly<Record<string, ItemType>> = {
  movies: 'movie',
  shows: 'show',
  seasons: 'season',
  episodes: 'episode',
};

/** The type of item a list poster is for, from its folder on media.trakt.tv (`/images/shows/…`). */
export function posterItemType(path: string): ItemType | undefined {
  const folder = path.match(FOLDER)?.[1];
  return folder ? SINGULAR[folder] : undefined;
}

/**
 * Whether a list's progress is all franchises: movies and no shows, the only items show progress tracks. Read from the
 * types of its first items, so it's true only once they cover the whole list; anything unseen or untyped is false.
 */
export function listMoviesOnly(itemCount: number, types: readonly (ItemType | undefined)[]): boolean {
  return types.length >= itemCount && types.includes('movie') && !types.includes('show') && !types.includes(undefined);
}
