import type { MovieResponse } from '@trakt/api';
import type { TagPill } from '../components/labels/TagPill.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import { movieTags } from './movieTags.ts';

/** A film opening this week, for the Box Office sidebar. */
export type OpeningRow = {
  readonly id: number;
  readonly href: string;
  readonly title: string;
  readonly poster?: string;
  /** "Today", or the day it opens ("Fri, Oct 9"). */
  readonly day: string;
  readonly tags: readonly TagPill[];
};

const day = (released: string, today: string) =>
  released.slice(0, 10) === today ? 'Today' : new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${released.slice(0, 10)}T00:00:00Z`));

/** Maps a movies calendar entry onto the sidebar's row. `today` is the viewer's date, `YYYY-MM-DD`. */
export function toOpeningRow(
  { released, movie }: { released: string; movie: MovieResponse },
  today: string,
): OpeningRow {
  return {
    id: movie.ids.trakt,
    href: `/movies/${movie.ids.slug}`,
    title: movie.title,
    poster: imageUrl(movie.images?.poster?.at(0), 'thumb'),
    day: day(released, today),
    tags: movieTags(movie, { short: true }),
  };
}
