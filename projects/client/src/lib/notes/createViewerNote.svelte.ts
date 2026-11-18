import { recentReads } from '../api/recentReads.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';
import type { NotableItem } from './NotableItem.ts';
import type { PrivateNote } from './PrivateNote.ts';
import { fetchPrivateNote } from './fetchPrivateNote.ts';

type Params = {
  item: Pick<NotableItem, 'type' | 'id' | 'slug'>;
  signedIn: boolean;
};

/**
 * A signed-in viewer's private note on an item, read in the browser after paint so the server renders without it.
 * Null while it loads, when there's none, and signed out. Kept in memory for a few minutes, so going Back shows it at
 * once; saving a note lets go of it.
 */
export function createViewerNote(params: () => Params) {
  let read = $state<{ type: string; id: number; note: PrivateNote | null }>();

  $effect(() => {
    const { item, signedIn } = params();
    if (!signedIn) return;
    const { type, id } = item;
    let current = true;
    const reading = recentReads.read(`note:${type}:${id}`, () =>
      fetchPrivateNote({ fetch: viewerFetch(), token: null, item }),
    );
    void reading.then((note) => {
      if (current) read = { type, id, note };
    });
    return () => {
      current = false;
    };
  });

  return {
    get note() {
      const { item, signedIn } = params();
      return signedIn && read?.type === item.type && read.id === item.id ? read.note : null;
    },
  };
}
