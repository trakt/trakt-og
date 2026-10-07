import type { ThemeFilter } from './discoverThemes.ts';

/** One chip under "What are you in the mood for?": a chart with filters, for movies, shows or both. */
export type DiscoverMood = {
  readonly id: string;
  readonly label: string;
  /** The chart it fills from; trending when left out. */
  readonly chart?: 'trending' | 'watched/weekly';
  /** A different label for the shows' version ("Under 30 Minutes"). */
  readonly showLabel?: string;
  readonly movie?: ThemeFilter;
  readonly show?: ThemeFilter;
};

/**
 * The year-round moods, after the season's own chip. Each fills from what's trending with its filters, or the week's
 * most watched, so the shelves stay fresh. Checked against the API on 2026-10-07: each returns a full shelf.
 */
export const DISCOVER_MOODS: readonly DiscoverMood[] = [
  {
    id: 'short',
    label: 'Under 95 Minutes',
    showLabel: 'Under 30 Minutes',
    movie: { runtimes: '60-95' },
    show: { runtimes: '1-30' },
  },
  {
    id: 'most-watched',
    label: 'Most Watched',
    chart: 'watched/weekly',
    movie: {},
    show: {},
  },
  {
    id: 'top-rated',
    label: 'Top Rated',
    movie: { ratings: '80-100' },
    show: { ratings: '85-100' },
  },
  {
    id: 'comedies',
    label: 'Easy Comedies',
    movie: { genres: 'comedy,-animation,-anime,-horror' },
    show: { genres: 'comedy,-animation,-anime' },
  },
  {
    id: 'family',
    label: 'Family Night',
    movie: { genres: 'family' },
    show: { genres: 'family' },
  },
  {
    id: 'anime',
    label: 'Anime',
    // No anime movies trend most weeks, so this is a shows chip.
    show: { genres: 'anime' },
  },
];
