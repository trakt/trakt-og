import type { ExternalLink } from '../components/summary/ExternalLink.ts';
import { iconLinks } from '../components/summary/iconLinks.ts';
import type { LinkedMedia } from '../components/summary/LinkedMedia.ts';
import { showSearch } from './showSearch.ts';

/** A show's external links: its site, IMDB, TMDB, TVDB and Fanart.tv, then JustWatch, Wikipedia and its socials. */
export function toShowLinks({ show, justwatch }: { show: LinkedMedia; justwatch?: string | null }): ExternalLink[] {
  const { ids, homepage } = show;
  const links: (ExternalLink | false)[] = [
    !!homepage && { label: 'Official Site', href: homepage },
    {
      label: 'IMDB',
      href: ids.imdb
        ? `https://www.imdb.com/title/${ids.imdb}`
        : `https://www.imdb.com/find?${new URLSearchParams({ q: show.title, s: 'tt' })}`,
    },
    !!ids.tmdb && { label: 'TMDB', href: `https://www.themoviedb.org/tv/${ids.tmdb}` },
    // OG hid TVDB for shows sourced from TMDB. The API doesn't say which, so any TVDB id gets the link.
    !!ids.tvdb && { label: 'TVDB', href: `https://www.thetvdb.com/dereferrer/series/${ids.tvdb}` },
    !!ids.tvdb && { label: 'Fanart.tv', href: `https://fanart.tv/series/${ids.tvdb}` },
  ];
  return [
    ...links.filter((link) => link !== false),
    ...iconLinks({ social: show.social_ids, justwatch, search: showSearch(show) }),
  ];
}
