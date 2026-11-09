import type { FranchiseRow } from './FranchiseRow.ts';

/** The movie a franchise's card features, and why. */
export type FranchiseFeature = {
  /** Up next, else soon (caught up, a movie still to come) once every released one is watched, else caught up. */
  readonly kind: 'up-next' | 'soon' | 'caught-up';
  readonly movie: FranchiseRow['movies'][number];
  /** The "Up next" tag over its art. A caught up franchise has the caught up bar instead. */
  readonly tag?: { readonly text: string; readonly kind: 'primary' };
  /** Caught up with a movie still to come: its release date, for the caught up bar. */
  readonly next?: string;
};
