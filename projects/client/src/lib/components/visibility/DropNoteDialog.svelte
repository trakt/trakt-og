<!--
  The notes modal after dropping a show: "You dropped..." over its fanart, and an empty note to say why. Saving writes
  a note on the show, the same kind v3 saves after a drop. Closing it without text leaves no note.
-->
<script lang="ts">
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import NotesDialog from '$lib/components/notes/NotesDialog.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import { saveNote } from '$lib/notes/saveNote';
import { dropNote } from './dropNote.svelte';

let open = $state(false);
let draft = $state('');
let busy = $state(false);

$effect(() => {
  if (!dropNote.target) return;
  draft = '';
  open = true;
});

$effect(() => {
  if (!open) dropNote.close();
});

async function save(text: string) {
  const target = dropNote.target;
  if (busy || !target) return;
  if (!text.trim()) {
    open = false;
    return;
  }
  busy = true;
  try {
    const result = await saveNote({
      fetch: authenticatedFetch({ manager: userManager() }),
      item: { type: 'show', id: target.id },
      note: null,
      text,
    });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success('Notes saved!');
    open = false;
  } finally {
    busy = false;
  }
}
</script>

{#if dropNote.target}
  {@const { title, year, fanart } = dropNote.target}
  <NotesDialog bind:open bind:draft item={{ title, year, fanart }} eyebrow="You dropped..." {busy} onsave={save} />
{/if}
