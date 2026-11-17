import { z } from 'zod/v4';
import { isApiUnavailable } from '../api/isApiUnavailable.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { noteRowsSchema } from '../users/notes/noteRowsSchema.ts';
import type { NotableItem } from './NotableItem.ts';
import type { PrivateNote } from './PrivateNote.ts';

type FetchPrivateNoteParams = {
  fetch: typeof fetch;
  /** Null in the browser, where `fetch` carries the viewer's sign-in. */
  token: string | null;
  item: Pick<NotableItem, 'type' | 'id' | 'slug'>;
};

// v3 has no `@trakt/api` contract. Its rows include the favorites-list note (`type: 'favorites'`), which isn't this one.
const v3NotesSchema = z.array(
  z.object({
    id: z.number(),
    notes: z.string().nullish(),
    created_at: z.string().nullish(),
    updated_at: z.string().nullish(),
    type: z.string(),
  }),
);

const json = (response: Response): Promise<unknown> =>
  response.ok ? response.json().catch(() => null) : Promise.resolve(null);

async function personNote(fetch: typeof globalThis.fetch, token: string | null, id: number) {
  // v3 only serves movies and shows. For people, API's listing returns every person note in one call.
  const response = await rawApiFetch({ fetch, token, path: '/users/me/notes/people?limit=all' });
  const note = noteRowsSchema.safeParse(await json(response)).data?.find((row) => row.person?.ids.trakt === id)?.note;
  return note
    ? { id: note.id, text: note.notes ?? '', createdAt: note.created_at ?? null, updatedAt: note.updated_at }
    : null;
}

/** v2 lists every note of a type, so this finds the one on the item itself, not on a play, rating or favorite. */
async function listedMediaNote(
  fetch: typeof globalThis.fetch,
  token: string | null,
  { type, id }: FetchPrivateNoteParams['item'],
) {
  const response = await rawApiFetch({ fetch, token, path: `/users/me/notes/${type}s?limit=all` });
  const note = noteRowsSchema
    .safeParse(await json(response))
    .data?.find((row) => row.attached_to.type === type && row[type]?.ids.trakt === id)?.note;
  return note
    ? { id: note.id, text: note.notes ?? '', createdAt: note.created_at ?? null, updatedAt: note.updated_at }
    : null;
}

async function mediaNote(fetch: typeof globalThis.fetch, token: string | null, item: FetchPrivateNoteParams['item']) {
  // v3 only serves movies and shows, by slug.
  if (!item.slug) return listedMediaNote(fetch, token, item);
  const response = await rawApiFetch({
    fetch,
    token,
    path: `/v3/users/me/notes/${item.type}/${encodeURIComponent(item.slug)}`,
  });
  // v3 is Official-only. Other client IDs read v2's listing instead.
  if (isApiUnavailable(response)) return listedMediaNote(fetch, token, item);
  const note = v3NotesSchema.safeParse(await json(response)).data?.find((row) => row.type === 'note');
  return note
    ? {
        id: note.id,
        text: note.notes ?? '',
        createdAt: note.created_at ?? null,
        updatedAt: note.updated_at ?? null,
      }
    : null;
}

/**
 * The note on a summary page's item, or null when there's none or the read fails (a stale token gets a 401 and the
 * page renders without it). Saving upserts, so a missed read can't duplicate.
 */
export function fetchPrivateNote({ fetch, token, item }: FetchPrivateNoteParams): Promise<PrivateNote | null> {
  const read = item.type === 'person' ? personNote(fetch, token, item.id) : mediaNote(fetch, token, item);
  return read.catch(() => null);
}
