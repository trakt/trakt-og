import { toBreadcrumbJsonLd } from '../jsonLd/toBreadcrumbJsonLd.ts';
import { toMovieJsonLd } from '../jsonLd/toMovieJsonLd.ts';
import { toTitleCrumbs } from '../jsonLd/toTitleCrumbs.ts';
import type { SeoMeta } from '../SeoMeta.ts';

type Movie = Parameters<typeof toMovieJsonLd>[0] & { readonly fullTitle: string };

/** `/movies/:id`: "Inception (2010)", its overview and its fanart, else its poster, with its structured data. */
export function toMovieSeo(movie: Movie): SeoMeta {
  return {
    title: movie.fullTitle,
    description: movie.overview || `Where to watch ${movie.fullTitle}, its ratings, comments and lists on Trakt.`,
    image: movie.fanart ?? movie.poster,
    imageAlt: movie.fullTitle,
    type: 'video.movie',
    jsonLd: [toMovieJsonLd(movie), toBreadcrumbJsonLd(toTitleCrumbs({ title: movie.fullTitle, href: movie.href }))],
  };
}
