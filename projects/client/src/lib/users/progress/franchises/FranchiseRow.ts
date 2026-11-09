import type { FranchiseFeature } from './FranchiseFeature.ts';
import type { FranchiseMovie } from './FranchiseMovie.ts';
import type { TickRun } from '../../../components/media/TickRun.ts';

/** One franchise on the progress page, from its movies and the viewer's plays. */
export type FranchiseRow = {
  readonly id: number;
  readonly title: string;
  readonly href: string;
  /** The first released movie's poster, as the show row has its show's. */
  readonly poster?: string;
  /** "2001-2011", or the one year. */
  readonly years?: string;
  readonly percent: number;
  readonly ticks: readonly TickRun[];
  /** Released movies watched, and released movies. */
  readonly watched: number;
  readonly released: number;
  readonly left: number;
  readonly plays: number;
  /** Every play's runtime, for the grid tooltip's "(4h 40m)". */
  readonly watchedMinutes: number;
  readonly watchedTime: string;
  readonly leftTime: string;
  readonly last?: { readonly title: string; readonly href: string; readonly relative?: string; readonly date: string };
  /** The movie the right card and the grid card show. */
  readonly feature?: FranchiseFeature;
  /** Every movie in release order, the unreleased ones too. */
  readonly movies: readonly (Omit<FranchiseMovie, 'released'> & {
    readonly watched: boolean;
    /** Out by now. One that isn't shows in the grid but isn't counted. */
    readonly released: boolean;
    readonly releaseDate: string;
  })[];
};
