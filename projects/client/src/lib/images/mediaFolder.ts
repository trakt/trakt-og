import type { MediaImageType } from './MediaImageType.ts';

/** A show cast member's id on media.trakt.tv: the show's Trakt id, then the person's. */
export type CharacterImageId = `${number}-${number}`;

const FOLDERS: Readonly<Record<MediaImageType | 'character', string>> = {
  movie: 'movies',
  show: 'shows',
  season: 'seasons',
  episode: 'episodes',
  person: 'people',
  network: 'networks',
  company: 'companies',
  list: 'lists',
  character: 'characters',
};

/** An item's folder on media.trakt.tv: `https://media.trakt.tv/{folder}/{id}/…`. */
export function mediaFolder(type: MediaImageType | 'character', id: number | CharacterImageId): string {
  return `https://media.trakt.tv/${FOLDERS[type]}/${id}`;
}
