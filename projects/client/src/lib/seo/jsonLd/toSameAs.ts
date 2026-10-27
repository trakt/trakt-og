import type { ExternalLink } from '../../components/summary/ExternalLink.ts';

/** IMDb's title or name page and TMDB's, from a summary's links out. IMDb's search fallback isn't the same thing. */
const SAME_AS = /^https:\/\/(www\.imdb\.com\/(title|name)\/|www\.themoviedb\.org\/)/;

/** The links out that are the same title or person on another site, for `sameAs`. */
export function toSameAs(links: readonly Pick<ExternalLink, 'href'>[]): string[] {
  return links.map(({ href }) => href).filter((href) => SAME_AS.test(href));
}
