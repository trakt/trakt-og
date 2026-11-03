<!--
  The "Private Notes" box under a summary's overview, in the Notes screen's card without the author: the label, the
  text in the comments' bubble with their Read More pill, and under it the Added or Updated stamp with the edit and delete icons
  at the end.
  Only an existing note shows. Like v3, og no longer starts general notes: new notes come with a favorite or a drop, or
  go on list items. Saving is optimistic: the box shows the new text at once and puts the old one back if the API
  fails. Deleting, or clearing the text, removes the note and the box goes.
-->
<script lang="ts">
import { tick } from 'svelte';
import NoteManage from '$lib/components/notes/NoteManage.svelte';
import NotesDialog from '$lib/components/notes/NotesDialog.svelte';
import NoteStamp from '$lib/components/notes/NoteStamp.svelte';
import ReadMore from '$lib/components/readmore/ReadMore.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import clock from '$lib/icons/regular/clock.svg?raw';
import type { NotableItem } from '$lib/notes/NotableItem';
import type { PrivateNote } from '$lib/notes/PrivateNote';
import { noteStamp } from '$lib/notes/noteStamp';
import { saveNote } from '$lib/notes/saveNote';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import { formatDate } from '$lib/utils/formatDate';
import { viewerFetch } from '../../auth/viewerFetch.ts';

interface Props {
  item: NotableItem;
  note: PrivateNote | null;
  signedIn: boolean;
  datePreferences: DatePreferences;
}

const { item, note: loaded, signedIn, datePreferences }: Props = $props();

// Follows the loader on navigation; a save overrides it until the next load.
let note = $derived(loaded);
const paragraphs = $derived(note?.text.split(/\n\s*\n/) ?? []);
const stamp = $derived(note && noteStamp(note));
const id = $props.id();
let open = $state(false);
let draft = $state('');
let saving = $state(false);
let section = $state<HTMLElement>();

function edit() {
  if (saving) return;
  draft = note?.text ?? '';
  open = true;
}

// A failed delete brings the box back after its icons were gone, so focus goes back to its edit icon.
async function refocus() {
  await tick();
  const focused = document.activeElement;
  if (!focused || focused === document.body || !focused.checkVisibility()) {
    section?.querySelector<HTMLElement>('.note-manage button')?.focus();
  }
}

async function save(text: string) {
  open = false;
  const previous = note;
  const trimmed = text.trim();
  if (trimmed === (previous?.text ?? '')) return;

  const now = new Date().toISOString();
  note = trimmed
    ? { id: previous?.id ?? 0, text: trimmed, createdAt: previous?.createdAt ?? now, updatedAt: now }
    : null;
  saving = true;
  const result = await saveNote({
    fetch: viewerFetch(),
    item,
    note: previous,
    text: trimmed,
  });
  saving = false;
  if (!result.ok) {
    note = previous;
    void refocus();
    toast.error(result.message);
    return;
  }
  note = result.note;
  if (trimmed) toast.success('Notes saved!');
}
</script>

{#if note}
<section class="private-notes" bind:this={section} aria-labelledby="{id}-title" aria-busy={saving}>
  <h2 id="{id}-title" class="title">Private Notes</h2>
  <div class="bubble">
    <ReadMore>
      <div class="text">{#each paragraphs as paragraph, i (i)}<p>{paragraph}</p>{/each}</div>
    </ReadMore>
  </div>
  {#if stamp || signedIn}
    <footer class="under-note">
      {#if stamp}
        <NoteStamp svg={clock} label={stamp.label} date={formatDate(stamp.at, { ...datePreferences, format: 'll' })}
          datetime={stamp.at} tone="var(--color-note-tag-date)" line="var(--color-comment-bubble-border)" />
      {/if}
      {#if signedIn}<NoteManage onedit={edit} ondelete={() => save('')} busy={saving} />{/if}
    </footer>
  {/if}
</section>
{/if}

{#if signedIn}
  <NotesDialog bind:open bind:draft {item} privacy="private" onsave={save} />
{/if}

<style>
.private-notes {
  margin-block-end: var(--notes-summary-bottom);
}

.title {
  margin: 0;
  color: var(--color-summary-label);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings);
  line-height: var(--line-height-base);
  text-transform: uppercase;
}

/* The comments' bubble: bordered, every corner alike. */
.bubble {
  --read-more-shade: var(--color-comment-bg);
  margin-block-start: var(--comment-bubble-gap);
  padding: var(--comment-bubble-padding);
  border: 1px solid var(--color-comment-bubble-border);
  border-radius: var(--radius-comment-bubble-round);
  background-color: var(--color-comment-bg);
  overflow-wrap: break-word;
}

.text {
  overflow-wrap: anywhere;
  white-space: pre-line;
}

p {
  margin: 0 0 var(--line-height-computed);

  &:last-child {
    margin-block-end: 0;
  }
}

/* The Added or Updated stamp, and the edit and delete icons at the end, like a note card's footer. */
.under-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--comment-stats-gap);
  padding-block-start: var(--comment-stats-space);

  & > :global(.note-manage) {
    margin-inline-start: auto;
  }
}
</style>
