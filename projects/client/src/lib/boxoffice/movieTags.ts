import type { MovieResponse } from '@trakt/api';
import type { TagPill } from '../components/labels/TagPill.ts';

const GENRES = 2;

const runtime = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`;
const titleize = (slug: string) => slug.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

/**
 * A box office film's pills: its certificate, its runtime ("1h 54m") and its first two genres. `short` keeps
 * the certificate and one genre, for the narrow sidebar.
 */
export function movieTags(
  movie: Pick<MovieResponse, 'certification' | 'runtime' | 'genres'>,
  { short = false }: { short?: boolean } = {},
): TagPill[] {
  return [
    ...(movie.certification ? [{ text: movie.certification }] : []),
    ...(movie.runtime && !short ? [{ text: runtime(movie.runtime) }] : []),
    ...(movie.genres ?? []).slice(0, short ? 1 : GENRES).map((genre) => ({ text: titleize(genre) })),
  ];
}
