import { mediaImage } from '../../images/mediaImage.ts';

/** The fanart of the movie or show a Watch Now path belongs to (a season's or episode's is its show's). */
export function watchNowArt(path: string): string | undefined {
  const [, kind, id] = path.match(/^\/(movies|shows)\/(\d+)/) ?? [];
  if (!kind || !id) return undefined;
  return mediaImage({ type: kind === 'movies' ? 'movie' : 'show', id: Number(id), slot: 'fanart', size: 'medium' });
}
