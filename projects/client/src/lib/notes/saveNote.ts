import { z } from 'zod/v4';
import { isApiUnavailable } from '../api/isApiUnavailable.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { NotableItem } from './NotableItem.ts';
import type { PrivateNote } from './PrivateNote.ts';
import { GENERIC_ERROR } from '../utils/genericError.ts';

type SaveNoteParams = {
  /** `authenticatedFetch` in the browser. */
  fetch: typeof fetch;
  item: Pick<NotableItem, 'type' | 'id'>;
  note: PrivateNote | null;
  text: string;
};

type SaveNoteResult =
  | { readonly ok: true; readonly note: PrivateNote | null }
  | { readonly ok: false; readonly message: string };

const writtenNote = z.object({
  id: z.number().int().positive(),
  notes: z.string().nullish(),
  updated_at: z.iso.datetime({ offset: true }).nullish(),
});

type WriteParams = { fetch: typeof globalThis.fetch; path: string; method: string; body?: unknown };

const write = ({ fetch, path, method, body }: WriteParams) =>
  rawApiFetch({
    fetch,
    path,
    init: {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    },
  });

/** An owned note's edit or delete: v3, or v2's `/notes/:id` for a client ID that may not call v3. */
async function changeNote(fetch: typeof globalThis.fetch, note: PrivateNote, notes: string) {
  const method = notes ? 'PUT' : 'DELETE';
  const response = await write({
    fetch,
    path: `/v3/users/me/notes/${note.id}`,
    method,
    body: { type: 'note', ...(notes ? { notes } : {}) },
  });
  if (!isApiUnavailable(response)) return response;
  return write({ fetch, path: `/notes/${note.id}`, method, body: notes ? { notes } : undefined });
}

/** Native writes address any owned note by id; only creation needs API's all-media endpoint. */
export async function saveNote({ fetch, item, note, text }: SaveNoteParams): Promise<SaveNoteResult> {
  const notes = text.trim();
  if (!notes && !note) return { ok: true, note: null };
  try {
    const response = note
      ? await changeNote(fetch, note, notes)
      : await write({
          fetch,
          path: '/notes',
          method: 'POST',
          body: { [item.type]: { ids: { trakt: item.id } }, notes },
        });
    // v3 answers an edit with a 204, v2 with the note.
    if (note && (response.status === 204 || response.status === 200)) {
      return { ok: true, note: notes ? { ...note, text: notes, updatedAt: new Date().toISOString() } : null };
    }
    if (response.status === 420) {
      return {
        ok: false,
        message: `You've already added ${response.headers.get('x-account-limit') ?? 'the most'} notes.`,
      };
    }
    if (note || response.status !== 201) return { ok: false, message: GENERIC_ERROR };
    const parsed = writtenNote.safeParse(await response.json().catch(() => null));
    if (!parsed.success) return { ok: false, message: GENERIC_ERROR };
    return {
      ok: true,
      note: { id: parsed.data.id, text: parsed.data.notes ?? '', updatedAt: parsed.data.updated_at ?? null },
    };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}
