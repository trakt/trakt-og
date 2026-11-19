import { mediaImage } from '../../../../images/mediaImage.ts';

/** `media.trakt.tv/movies/843/medium/poster.webp`, as the API sends them now. */
const SHORT = /(?:^|\/)(movies|shows)\/(\d+)\/[a-z]+\/poster\./;
/** `media.trakt.tv/images/movies/000/000/843/posters/...`, the older hashed form. */
const HASHED = /\/images\/(movies|shows)\/(\d+)\/(\d+)\/(\d+)\/posters\//;

/**
 * A poster or the fanart of the movie or show a list poster belongs to, read from the poster's path: both forms above
 * are movie 843. Built from the id, like every other box's art, since the hashed path isn't always there. Anything
 * else has none.
 */
export function posterArt(path: string | null | undefined, slot: 'poster' | 'fanart'): string | undefined {
  const match = path?.match(SHORT) ?? path?.match(HASHED);
  if (!match) return undefined;
  const [, folder, ...digits] = match;
  const type = folder === 'movies' ? 'movie' : 'show';
  return mediaImage({ type, id: Number(digits.join('')), slot, size: 'thumb' });
}
