import type { Crumb } from './Crumb.ts';

type Step = { readonly title: string; readonly href?: string };

type Params = {
  /** The page's own title and path. */
  title: string;
  href: string;
  /** The tag bar's way up: a season's show, an episode's show and season. Steps without a link are skipped. */
  parents?: readonly Step[];
};

const SECTIONS: readonly [string, Crumb][] = [
  ['/movies/', { name: 'Movies', path: '/movies/trending' }],
  ['/shows/', { name: 'Shows', path: '/shows/trending' }],
];

/** A title's trail: its section's chart, then its parents, then itself. People have no section of their own. */
export function toTitleCrumbs({ title, href, parents = [] }: Params): Crumb[] {
  const section = SECTIONS.find(([prefix]) => href.startsWith(prefix))?.[1];
  const steps = parents.flatMap((parent) => (parent.href ? [{ name: parent.title, path: parent.href }] : []));
  return [...(section ? [section] : []), ...steps, { name: title, path: href }];
}
