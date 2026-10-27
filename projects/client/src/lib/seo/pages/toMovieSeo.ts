import type { toMovieSummary } from '../../movies/toMovieSummary.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Movie = Pick<ReturnType<typeof toMovieSummary>, 'fullTitle' | 'overview' | 'fanart' | 'poster'>;

/** `/movies/:id`: "Inception (2010)", its overview and its fanart, else its poster. */
export function toMovieSeo(movie: Movie): SeoMeta {
  return {
    title: movie.fullTitle,
    description: movie.overview || `Where to watch ${movie.fullTitle}, its ratings, comments and lists on Trakt.`,
    image: movie.fanart ?? movie.poster,
    imageAlt: movie.fullTitle,
    type: 'video.movie',
  };
}
