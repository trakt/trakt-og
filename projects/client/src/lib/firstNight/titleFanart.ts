import { mediaImage } from '../images/mediaImage.ts';

const TRAKT_IDS: Readonly<Record<string, number>> = {
  'shows/mr-robot': 93720,
};

/** The fanart of a show or movie in `TRAKT_IDS`, from its Trakt id. Any other title comes back as undefined. */
export function titleFanart(type: 'shows' | 'movies', slug: string) {
  const id = TRAKT_IDS[`${type}/${slug}`];
  if (id === undefined) return Promise.resolve(undefined);

  return Promise.resolve(mediaImage({ type: type === 'shows' ? 'show' : 'movie', id, slot: 'fanart', size: 'full' }));
}
