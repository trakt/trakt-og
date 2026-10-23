import type { ExternalLink } from '../components/summary/ExternalLink.ts';
import { iconLinks } from '../components/summary/iconLinks.ts';
import type { LinkedMedia } from '../components/summary/LinkedMedia.ts';
import { showSearch } from './showSearch.ts';

type SeasonLinksParams = {
  show: LinkedMedia;
  number: number;
  /** From the season's Watch Now rank. */
  justwatch?: string | null;
};

/** A season's external links, the same on its summary and its subpages: IMDB, TMDB, then the icons. OG's
 * Fanart.tv link is for shows and movies only. */
export function toSeasonLinks({ show, number, justwatch }: SeasonLinksParams): ExternalLink[] {
  const { ids } = show;
  const links: (ExternalLink | false)[] = [
    {
      label: 'IMDB',
      href: ids.imdb
        ? `https://www.imdb.com/title/${ids.imdb}/episodes?season=${number}`
        : `https://www.imdb.com/find?${new URLSearchParams({ q: `${show.title} season ${number}`, s: 'tt' })}`,
    },
    !!ids.tmdb && { label: 'TMDB', href: `https://www.themoviedb.org/tv/${ids.tmdb}/season/${number}` },
  ];
  return [
    ...links.filter((link) => link !== false),
    ...iconLinks({ social: null, justwatch, search: `${showSearch(show)} Season ${number}` }),
  ];
}
