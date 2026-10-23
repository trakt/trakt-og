// The note prompt after a drop, like v3's: why you stopped watching. The drop control opens it once the drop saves,
// and <DropNoteDialog /> in the root layout renders it, so it outlives a progress row that leaves the page.
// Call it from interactions only: this module is shared by every request on the server.
import type { FavoriteTarget } from '../../favorites/FavoriteTarget.ts';

let target = $state<FavoriteTarget | null>(null);

export const dropNote = {
  get target() {
    return target;
  },
  /** Reads the show's year and fanart for the dialog's title band first; the title alone is enough if that fails. */
  async open(show: { id: number; title: string }): Promise<void> {
    const base = { type: 'show', id: show.id, title: show.title } as const;
    target = await import('../../favorites/loadFavoriteTarget.ts')
      .then(({ loadFavoriteTarget }) => loadFavoriteTarget(base))
      .catch(() => base);
  },
  close() {
    target = null;
  },
};
