import type { HeaderLink } from './HeaderLink.ts';

const isOn = (link: HeaderLink, pathname: string) =>
  pathname === link.href || (!link.exact && pathname.startsWith(`${link.href}/`));

/**
 * The bar link for the page you're on. The link whose path the page is on, or under, wins, the longest first, so Box
 * Office beats Movies on `/movies/boxoffice`. Otherwise OG's rule: the main link whose first path segment matches
 * (`/shows/popular` selects Shows).
 */
export function currentHeaderLink(links: readonly HeaderLink[], pathname: string): string | undefined {
  const own = links
    .filter((link) => isOn(link, pathname))
    .toSorted((a, b) => b.href.length - a.href.length)
    .at(0);
  if (own) return own.id;

  const section = pathname.split('/').at(1);
  return links.find((link) => link.group === 'main' && link.href.split('/').at(1) === section)?.id;
}
