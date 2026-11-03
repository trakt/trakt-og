import { describe, expect, it } from 'vitest';
import type { OverlaySlices } from '../overlay/OverlaySlices.ts';
import { patchFavoriteNote } from './patchFavoriteNote.ts';

type Favorites = OverlaySlices['favorites'];

const overlayWith = (favorites: Favorites) => {
  let slice = favorites;
  return {
    read: () => slice,
    patch: (_name: 'favorites', update: (data: Favorites) => Favorites) => {
      const before = slice;
      slice = update(slice);
      return () => (slice = before);
    },
  };
};

describe('patchFavoriteNote', () => {
  it("should set a favorite's note and roll it back", () => {
    const overlay = overlayWith({ movie: new Set([1]), show: new Set() });
    const rollback = patchFavoriteNote(overlay, { type: 'movie', id: 1 }, { id: 9, text: 'Still the best' });
    expect(overlay.read().notes?.movie.get(1)).toEqual({ id: 9, text: 'Still the best' });
    rollback();
    expect(overlay.read().notes).toBeUndefined();
  });

  it('should drop a note with its favorite', () => {
    const overlay = overlayWith({
      movie: new Set(),
      show: new Set([2]),
      notes: { movie: new Map(), show: new Map([[2, { id: 9, text: 'Rewatch' }]]) },
    });
    patchFavoriteNote(overlay, { type: 'show', id: 2 }, null);
    expect(overlay.read().notes?.show.has(2)).toBe(false);
  });
});
