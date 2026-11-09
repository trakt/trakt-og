import type { MovieResponse } from '@trakt/api';
import type { TagPill } from '../components/labels/TagPill.ts';
import { mediaImage } from '../images/mediaImage.ts';
import { movieTags } from './movieTags.ts';

/** A film opening Friday, for the Box Office sidebar. */
export type OpeningRow = {
  readonly id: number;
  readonly href: string;
  readonly title: string;
  readonly poster?: string;
  readonly tags: readonly TagPill[];
};

/** Maps a movies calendar entry onto the sidebar's row: its poster and short pills. */
export function toOpeningRow({ movie }: { movie: MovieResponse }): OpeningRow {
  return {
    id: movie.ids.trakt,
    href: `/movies/${movie.ids.slug}`,
    title: movie.title,
    poster: mediaImage({ type: 'movie', id: movie.ids.trakt, slot: 'poster', size: 'thumb' }),
    tags: movieTags(movie, { short: true }),
  };
}
