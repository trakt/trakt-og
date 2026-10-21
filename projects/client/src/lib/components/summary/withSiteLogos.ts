import fanartTv from '$lib/icons/sites/fanart-tv.svg?raw';
import imdb from '$lib/icons/sites/imdb.svg?raw';
import officialSite from '$lib/icons/sites/official-site.svg?raw';
import tmdb from '$lib/icons/sites/tmdb.svg?raw';
import tvdb from '$lib/icons/sites/tvdb.svg?raw';
import type { ExternalLink } from './ExternalLink.ts';

/** OG's fonts had no logos for these: they come from the current Trakt site and the sites' own artwork. */
const SITE_ICONS: Readonly<Record<string, string>> = {
  'Official Site': officialSite,
  IMDB: imdb,
  TMDB: tmdb,
  TVDB: tvdb,
  'Fanart.tv': fanartTv,
};

/** Each logo's color under the pointer: its site's brand color, or none for a plain one (Wikipedia). */
const SITE_COLORS: Readonly<Record<string, string>> = {
  IMDB: 'var(--color-site-imdb)',
  TMDB: 'var(--color-site-tmdb)',
  TVDB: 'var(--color-site-tvdb)',
  'Fanart.tv': 'var(--color-site-fanart)',
  JustWatch: 'var(--color-site-justwatch)',
  Twitter: 'var(--color-site-twitter)',
  Facebook: 'var(--color-site-facebook)',
  Instagram: 'var(--color-site-instagram)',
};

/** Gives the sites with a logo their icon and brand color, and puts every icon link ahead of the text ones. */
export function withSiteLogos(links: readonly ExternalLink[]): ExternalLink[] {
  const resolved = links.map((link) => {
    const icon = link.icon ?? SITE_ICONS[link.label];
    const color = link.color ?? SITE_COLORS[link.label];
    return { ...link, ...(icon ? { icon } : {}), ...(color ? { color } : {}) };
  });
  return [...resolved.filter((link) => link.icon), ...resolved.filter((link) => !link.icon)];
}
