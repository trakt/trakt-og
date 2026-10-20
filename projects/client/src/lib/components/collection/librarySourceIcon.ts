import jellyfin from '../../assets/apps/jellyfin.svg?raw';
import plex from '../../icons/trakt/plex.svg?raw';
import type { LibrarySource } from './LibrarySource.ts';

// OG's fonts have no Jellyfin glyph, so it's OG's Jellyfin app logo in one color.
const SOURCES: Readonly<Record<LibrarySource, { svg: string; name: string }>> = {
  plex: { svg: plex, name: 'Plex' },
  jellyfin: { svg: jellyfin, name: 'Jellyfin' },
};

/**
 * Where a library item lives: the first source's icon, and every source's name ("Plex and Jellyfin"). Undefined for
 * items added by hand, which keep the library icon.
 */
export function librarySourceIcon(sources: readonly LibrarySource[] | undefined) {
  const first = sources?.at(0);
  if (!sources || !first) return undefined;
  return {
    svg: SOURCES[first].svg,
    name: new Intl.ListFormat('en', { type: 'conjunction' }).format(sources.map((source) => SOURCES[source].name)),
  };
}
