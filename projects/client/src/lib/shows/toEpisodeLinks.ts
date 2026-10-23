import type { ExternalLink } from '../components/summary/ExternalLink.ts';
import { iconLinks } from '../components/summary/iconLinks.ts';
import type { LinkedMedia } from '../components/summary/LinkedMedia.ts';
import { showSearch } from './showSearch.ts';

type EpisodeLinksParams = {
  show: LinkedMedia;
  episode: {
    readonly season: number;
    readonly number: number;
    readonly title?: string | null;
    readonly ids: { readonly imdb?: string | null };
  };
};

/** An episode's external links, the same on its summary and its subpages: IMDB, TMDB, then Wikipedia. */
export function toEpisodeLinks({ show, episode }: EpisodeLinksParams): ExternalLink[] {
  const title = episode.title?.trim() ?? '';
  const links: (ExternalLink | false)[] = [
    {
      label: 'IMDB',
      href: episode.ids.imdb
        ? `https://www.imdb.com/title/${episode.ids.imdb}`
        : `https://www.imdb.com/find?${new URLSearchParams({ q: `${show.title} ${title}`.trim(), s: 'ep' })}`,
    },
    !!show.ids.tmdb && {
      label: 'TMDB',
      href: `https://www.themoviedb.org/tv/${show.ids.tmdb}/season/${episode.season}/episode/${episode.number}`,
    },
  ];
  return [
    ...links.filter((link) => link !== false),
    ...iconLinks({ social: null, search: `${showSearch(show)}${title ? ` ${title}` : ''}` }),
  ];
}
