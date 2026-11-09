import type { Franchise } from './Franchise.ts';

/** Official lists slugged `*-collection` that gather films by studio or curator, not by franchise. */
const NOT_FRANCHISES: ReadonlySet<string> = new Set(['the-criterion-collection']);

const COLLECTION = /-collection(-|$)/;
const MIN_MOVIES = 2;

/** A franchise is an official `*-collection` list of at least two movies. */
export const isFranchise = ({ slug, movieIds }: Pick<Franchise, 'slug' | 'movieIds'>): boolean =>
  COLLECTION.test(slug) && !NOT_FRANCHISES.has(slug) && movieIds.length >= MIN_MOVIES;
