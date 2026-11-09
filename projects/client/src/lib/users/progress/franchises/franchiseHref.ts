import type { Franchise } from './Franchise.ts';

/** The franchise's official list page, linked directly rather than through a redirect. */
export const franchiseHref = ({ slug }: Pick<Franchise, 'slug'>) => `/lists/official/${slug}`;
