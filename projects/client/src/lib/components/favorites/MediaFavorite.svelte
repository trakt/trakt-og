<script lang="ts">
import { requireSignIn } from '#lib/auth/requireSignIn.ts';
import { page } from '$app/state';
import type { Snippet } from 'svelte';
import { rawApiFetch } from '#lib/api/rawApiFetch.ts';
import NotesDialog from '#lib/components/notes/NotesDialog.svelte';
import { watchedFirst } from '#lib/components/rating/watchedFirst.ts';
import { toast } from '#lib/components/toast/toast.svelte.ts';
import type { FavoriteTarget } from '#lib/favorites/FavoriteTarget.ts';
import { loadFavoriteTarget } from '#lib/favorites/loadFavoriteTarget.ts';
import { patchFavoriteNote } from '#lib/favorites/patchFavoriteNote.ts';
import { saveFavoriteNote } from '#lib/favorites/saveFavoriteNote.ts';
import { toggleFavorite } from '#lib/favorites/toggleFavorite.ts';
import { overlay } from '#lib/overlay/overlay.ts';
import { formatDate } from '#lib/utils/formatDate.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';

interface Props {
  target: FavoriteTarget;
  /** `locked` is why favoriting is off ("Watch it first to favorite it"): render the trigger disabled with it as a tip. */
  /**
   * `date` has the time, for the summary button; `day` is only the date, for a tooltip. `notable` once the favorite's
   * note can be read and saved, `note` is its text when it has one, and `editNote` opens it in the notes dialog,
   * which deletes it too.
   */
  trigger: Snippet<
    [
      {
        selected: boolean;
        date?: string;
        day?: string;
        busy: boolean;
        locked?: string;
        toggle: () => void;
        notable: boolean;
        note?: string;
        noteBusy: boolean;
        editNote: () => void;
      },
    ]
  >;
}
const { target, trigger }: Props = $props();
let busy = $state(false);
let saving = $state(false);
let open = $state(false);
let draft = $state('');
let saved = '';
let noteId = $state<number | null>(null);
let promptTarget = $state<FavoriteTarget | null>(null);
const membership = $derived(overlay.state(target.type, target.id));
const locked = $derived(watchedFirst(membership, 'favorite'));
const date = $derived(
  membership.favoritedAt ? formatDate(membership.favoritedAt, { ...page.data.datePreferences, time: true }) : undefined,
);
const day = $derived(
  membership.favoritedAt ? formatDate(membership.favoritedAt, page.data.datePreferences) : undefined,
);

const request = (method: 'POST' | 'PUT') => (path: string, body?: unknown) =>
  rawApiFetch({
    fetch: viewerFetch(),
    path,
    init: body === undefined ? undefined : {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  });

async function toggle() {
  if (busy || saving || locked) return;
  if (!(await requireSignIn())) return;
  busy = true;
  const remove = Boolean(membership.favorited);
  const loading = remove ? undefined : loadFavoriteTarget(target);
  try {
    const note = await toggleFavorite({
      target,
      remove,
      overlay,
      request: request('POST'),
      notify: toast,
    });
    if (note && loading) {
      promptTarget = await loading;
      noteId = note.id;
      draft = note.notes;
      saved = note.notes;
      open = true;
    }
  } finally {
    busy = false;
  }
}

async function save(notes: string) {
  if (saving || noteId === null) return;
  const id = noteId;
  saving = true;
  try {
    if (await saveFavoriteNote({ id, notes, previous: saved, request: request('PUT'), notify: toast })) {
      open = false;
      patchFavoriteNote(overlay, target, { id, text: notes.trim() });
    }
  } finally {
    saving = false;
  }
}

async function editNote() {
  const note = membership.favoriteNote;
  if (!note || saving || busy) return;
  promptTarget = await loadFavoriteTarget(target);
  noteId = note.id;
  draft = note.text;
  saved = note.text;
  open = true;
}

// Clears the text and keeps the favorite, putting the note back if the API fails.
async function deleteNote() {
  const note = membership.favoriteNote;
  if (!note?.text || saving || busy) return;
  open = false;
  saving = true;
  const rollback = patchFavoriteNote(overlay, target, { ...note, text: '' });
  try {
    const quiet = { success: () => {}, error: toast.error };
    if (!(await saveFavoriteNote({ id: note.id, notes: '', previous: note.text, request: request('PUT'), notify: quiet }))) rollback();
  } finally {
    saving = false;
  }
}
</script>

{@render trigger({
  selected: Boolean(membership.favorited),
  date,
  day,
  busy,
  locked,
  toggle,
  notable: membership.favoriteNote !== undefined,
  note: membership.favoriteNote?.text || undefined,
  noteBusy: saving,
  editNote,
})}
{#if promptTarget}
  <NotesDialog bind:open bind:draft item={promptTarget} favorite busy={saving} onsave={save}
    ondelete={membership.favoriteNote?.text ? deleteNote : undefined} />
{/if}
