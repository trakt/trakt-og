import type { PrivateNote } from './PrivateNote.ts';
import { fetchPrivateNote } from './fetchPrivateNote.ts';
import type { NotableItem } from './NotableItem.ts';

type LoadPrivateNoteParams = {
  fetch: typeof fetch;
  token: string | null;
  item: Pick<NotableItem, 'type' | 'id' | 'slug'>;
};

/** The viewer's private note on a summary page's item, or null when logged out, when there's none, or when the read fails. */
export function loadPrivateNote({ fetch, token, item }: LoadPrivateNoteParams): Promise<PrivateNote | null> {
  if (!token) return Promise.resolve(null);
  return fetchPrivateNote({ fetch, token, item });
}
