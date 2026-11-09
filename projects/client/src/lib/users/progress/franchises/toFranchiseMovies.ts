import type { ListItemRow } from '../../../lists/listItemRowsSchema.ts';
import { imageUrl } from '../../../utils/imageUrl.ts';
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
          poster: imageUrl(movie.images?.poster?.at(0), 'medium'),
          fanart: imageUrl(movie.images?.fanart?.at(0), 'medium'),
          rating: movie.rating ?? undefined,
          released: movie.released ?? '',
          runtime: movie.runtime ?? 0,
        },
      ];
    })
    .toSorted((a, b) => a.released.localeCompare(b.released) || a.id - b.id);
}
