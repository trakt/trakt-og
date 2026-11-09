import type { MediaImageType } from './MediaImageType.ts';

const FOLDERS: Readonly<Record<MediaImageType, string>> = {
  movie: 'movies',
  show: 'shows',
  season: 'seasons',
  episode: 'episodes',
  person: 'people',
  network: 'networks',
  company: 'companies',
  list: 'lists',
};

/** An item's folder on media.trakt.tv: `https://media.trakt.tv/{folder}/{id}/…`. */
export function mediaFolder(type: MediaImageType, id: number): string {
  return `https://media.trakt.tv/${FOLDERS[type]}/${id}`;
}
