import type { ReleaseDate } from './toMovieReleases.ts';

/** A release dot's accessible name: its type, "(limited)" for a limited run, then its date. */
export const releaseLabel = ({ type, limited, dateText }: ReleaseDate): string =>
  `${type}${limited ? ' (limited)' : ''}, ${dateText}`;
