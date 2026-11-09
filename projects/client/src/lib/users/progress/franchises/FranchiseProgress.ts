import type { Franchise } from './Franchise.ts';

/** A franchise the viewer has started, counted from the catalog's movie ids. */
export type FranchiseProgress = {
  readonly franchise: Franchise;
  /** Its movies the viewer has watched. */
  readonly watched: number;
  readonly total: number;
  /** The latest play of any of its movies. */
  readonly lastAt: string;
};
