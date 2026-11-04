import type { MovieResponse } from '@trakt/api';
import type { TagPill } from '../components/labels/TagPill.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import { movieTags } from './movieTags.ts';
import { type WeekInRelease, weekInRelease } from './weekInRelease.ts';

/** One film on the box office chart. */
export type BoxOfficeRow = {
  readonly id: number;
  readonly href: string;
  readonly title: string;
  readonly year?: number;
  readonly poster?: string;
  readonly tags: readonly TagPill[];
  readonly run: WeekInRelease | null;
  /** The weekend gross, in dollars. */
  readonly revenue: number;
  /** The total US gross so far, in dollars, or null when the list doesn't have it. */
  readonly totalGross: number | null;
  readonly rating?: number;
  readonly runtime?: number;
};

/**
 * Maps a `/movies/boxoffice` row onto the chart's row, its run counted from the weekend's `friday` and its total gross
 * looked up in `totals` by the film's Trakt id.
 */
export function toBoxOfficeRow(
  { revenue, movie }: { revenue?: number | null; movie: MovieResponse },
  friday: string,
  totals: ReadonlyMap<number, number> = new Map(),
): BoxOfficeRow {
  return {
    id: movie.ids.trakt,
    href: `/movies/${movie.ids.slug}`,
    title: movie.title,
    year: movie.year ?? undefined,
    poster: imageUrl(movie.images?.poster?.at(0), 'thumb'),
    tags: movieTags(movie),
    run: weekInRelease(movie.released, friday),
    revenue: revenue ?? 0,
    totalGross: totals.get(movie.ids.trakt) ?? null,
    rating: movie.rating ?? undefined,
    runtime: movie.runtime ?? undefined,
  };
}
