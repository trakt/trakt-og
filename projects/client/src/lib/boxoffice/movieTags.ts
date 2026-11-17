import type { MovieResponse } from '@trakt/api';
import type { TagPill } from '../components/labels/TagPill.ts';
import { certificationPill } from '../components/labels/certificationPill.ts';
import { genreLabel } from '../utils/genreLabel.ts';

const GENRES = 2;

const runtime = (minutes: number) =>
  minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`;

/**
 * A box office film's pills: its certificate (a badge, with OG's tip saying what it means), its runtime ("1h 54m")
 * and its first two genres joined in one pill. `short` keeps one genre, for the narrow sidebar.
 */
export function movieTags(
  movie: Pick<MovieResponse, 'certification' | 'runtime' | 'genres'>,
  { short = false }: { short?: boolean } = {},
): TagPill[] {
  const genres = (movie.genres ?? []).slice(0, short ? 1 : GENRES).map(genreLabel);
  return [
    ...(movie.certification ? [certificationPill(movie.certification)] : []),
    ...(movie.runtime ? [{ text: runtime(movie.runtime) }] : []),
    ...(genres.length > 0 ? [{ segments: genres }] : []),
  ];
}
