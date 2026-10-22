import type { ExternalLink } from '../components/summary/ExternalLink.ts';
import { iconLinks } from '../components/summary/iconLinks.ts';
import type { LinkedMedia } from '../components/summary/LinkedMedia.ts';

/** A movie's external links: its site, IMDB, TMDB and Fanart.tv, then JustWatch, Wikipedia and its socials. */
export function toMovieLinks({ movie, justwatch }: { movie: LinkedMedia; justwatch?: string | null }): ExternalLink[] {
  const { ids, homepage } = movie;
  const links: (ExternalLink | false)[] = [
    !!homepage && { label: 'Official Site', href: homepage },
    {
      label: 'IMDB',
      href: ids.imdb
        ? `https://www.imdb.com/title/${ids.imdb}`
        : `https://www.imdb.com/find?${new URLSearchParams({ q: movie.title, s: 'tt' })}`,
    },
    !!ids.tmdb && { label: 'TMDB', href: `https://www.themoviedb.org/movie/${ids.tmdb}` },
    !!ids.tmdb && { label: 'Fanart.tv', href: `https://fanart.tv/movie/${ids.tmdb}` },
  ];
  return [
    ...links.filter((link) => link !== false),
    ...iconLinks({
      social: movie.social_ids,
      justwatch,
      search: `${movie.year ? `${movie.title} ${movie.year}` : movie.title} Movie`,
    }),
  ];
}
