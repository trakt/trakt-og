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
  readonly rating?: number;
  readonly runtime?: number;
};

/** Maps a `/movies/boxoffice` row onto the chart's row, its run counted from the weekend's `friday`. */
export function toBoxOfficeRow(
  { revenue, movie }: { revenue?: number | null; movie: MovieResponse },
  friday: string,
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
    rating: movie.rating ?? undefined,
    runtime: movie.runtime ?? undefined,
  };
}
