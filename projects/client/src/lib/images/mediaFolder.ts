import type { MediaImageType } from './MediaImageType.ts';

/** An actor in character on media.trakt.tv: the show or movie and its Trakt id, then the person's. */
export type PortraitId = `${'show' | 'movie'}-${number}-${number}`;

const FOLDERS: Readonly<Record<MediaImageType | 'portrait', string>> = {
  movie: 'movies',
  show: 'shows',
  season: 'seasons',
  episode: 'episodes',
  person: 'people',
  network: 'networks',
  company: 'companies',
  list: 'lists',
  portrait: 'portraits',
};

/** An item's folder on media.trakt.tv: `https://media.trakt.tv/{folder}/{id}/…`. */
export function mediaFolder(type: MediaImageType | 'portrait', id: number | PortraitId): string {
  return `https://media.trakt.tv/${FOLDERS[type]}/${id}`;
}
