import type { OverlaySlices } from '../overlay/OverlaySlices.ts';
import type { FavoriteNote } from './FavoriteNote.ts';
import type { FavoriteTarget } from './FavoriteTarget.ts';

/** Sets a favorite's note on the overlay, or drops it with the favorite (`null`). Returns the rollback. */
export function patchFavoriteNote(
  overlay: {
    patch: (name: 'favorites', update: (data: OverlaySlices['favorites']) => OverlaySlices['favorites']) => () => void;
  },
  { type, id }: Pick<FavoriteTarget, 'type' | 'id'>,
  note: FavoriteNote | null,
) {
  return overlay.patch('favorites', (favorites) => {
    const notes = new Map(favorites.notes?.[type]);
    if (note) notes.set(id, note);
    else notes.delete(id);
    return { ...favorites, notes: { movie: new Map(), show: new Map(), ...favorites.notes, [type]: notes } };
  });
}
