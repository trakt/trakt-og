import type { ListItemRow } from '../../../lists/listItemRowsSchema.ts';
import { mediaImage } from '../../../images/mediaImage.ts';
import type { FranchiseMovie } from './FranchiseMovie.ts';

/** A franchise's movies in release order. A movie without a release date can't be placed, so it's left out. */
export function toFranchiseMovies(rows: readonly ListItemRow[]): readonly FranchiseMovie[] {
  return rows
    .flatMap((row): FranchiseMovie[] => {
      if (row.type !== 'movie' || !row.movie.released) return [];
      const { movie } = row;
      return [
        {
          id: movie.ids.trakt,
          title: movie.title,
          year: movie.year ?? undefined,
          href: `/movies/${movie.ids.slug}`,
          poster: mediaImage({ type: 'movie', id: movie.ids.trakt, slot: 'poster', size: 'medium' }),
          fanart: mediaImage({ type: 'movie', id: movie.ids.trakt, slot: 'fanart', size: 'medium' }),
          rating: movie.rating ?? undefined,
          released: movie.released ?? '',
          runtime: movie.runtime ?? 0,
        },
      ];
    })
    .toSorted((a, b) => a.released.localeCompare(b.released) || a.id - b.id);
}
