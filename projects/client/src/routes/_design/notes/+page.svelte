<script lang="ts">
import Specimen from '$lib/design/Specimen.svelte';
import EpisodeTypeBadge from '$lib/components/media/EpisodeTypeBadge.svelte';
import NoteManage from '$lib/components/notes/NoteManage.svelte';
import NotesDialog from '$lib/components/notes/NotesDialog.svelte';
import NoteCard from '$lib/components/notes/NoteCard.svelte';
import PrivateNotes from '$lib/components/summary/PrivateNotes.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import { noteRowsSchema } from '$lib/users/notes/noteRowsSchema';
import { toNote } from '$lib/users/notes/toNote';

let open = $state(false);
let draft = $state('');
const preferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const item = { type: 'movie', id: 1, slug: 'fight-club-1999', title: 'Fight Club', year: 1999 } as const;
const note = {
  id: 1,
  text: 'Watched this on a flight.\nDeserves a proper rewatch.',
  updatedAt: '2026-09-29T12:00:00Z',
};
const rows = noteRowsSchema.parse([
  {
    type: 'movie',
    movie: { title: 'Fight Club', ids: { trakt: 1 } },
    attached_to: { type: 'movie' },
    note: {
      id: 1,
      notes: 'A spoiler note. Reveal with the keyboard or mouse.',
      privacy: 'public',
      spoiler: true,
      updated_at: '2026-09-29T12:00:00Z',
      user: { username: 'og_tester', name: 'OG Tester', ids: { slug: 'og_tester' }, vip: true, vip_years: 7 },
    },
  },
  {
    type: 'movie',
    movie: { title: 'Fight Club', ids: { trakt: 1 } },
    attached_to: { type: 'rating', rating: 7, rated_at: '2026-09-28T12:00:00Z' },
    note: {
      id: 2,
      notes: 'A long note with paragraphs.\n\n'.repeat(40),
      privacy: 'private',
      updated_at: '2026-09-29T12:00:00Z',
      user: { username: 'og_tester', ids: { slug: 'og_tester' } },
    },
  },
  {
    type: 'movie',
    movie: { title: 'Fight Club', ids: { trakt: 1 } },
    attached_to: { type: 'history', watched_at: '2026-09-27T20:15:00Z' },
    note: {
      id: 3,
      notes: 'Watched on the plane with friends.',
      privacy: 'friends',
      updated_at: '2026-09-27T20:20:00Z',
      user: { username: 'og_tester', name: 'OG Tester', ids: { slug: 'og_tester' }, vip: true, vip_years: 7 },
    },
  },
  {
    type: 'show',
    show: { title: 'Andor', ids: { trakt: 2 } },
    attached_to: { type: 'collection', collected_at: '2026-09-26T08:20:00Z' },
    note: {
      id: 4,
      notes: 'Picked up the 4K steelbook.',
      privacy: 'public',
      updated_at: '2026-09-26T08:24:00Z',
      user: { username: 'og_tester', name: 'OG Tester', ids: { slug: 'og_tester' } },
    },
  },
]);
</script>

<Specimen title="Section toolbar" bleed note="The notes page's toolbar, with its filter and summary slots.">
  <SectionToolbar>
    {#snippet filters()}Note type filter{/snippet}
    {#snippet summary()}4 notes · Added Date{/snippet}
  </SectionToolbar>
</Specimen>

<Specimen title="Note cards"
  note="A spoiler note, a long private one on a rating, a friends-only one on a play and a public one on a library item. Edit opens the notes dialog.">
  <div class="badge-example"><EpisodeTypeBadge kind="series-premiere" label="Series Premiere" /></div>
  {#each rows as row (row.note.id)}
    {@const note = toNote(row, preferences)}
    {#if note}
      <NoteCard {note}>
        {#snippet manage()}
          <NoteManage onedit={() => { draft = note.text; open = true; }} ondelete={() => {}} />
        {/snippet}
      </NoteCard>
    {/if}
  {/each}
</Specimen>

<Specimen title="Private notes box"
  note="Under a summary's overview, only when the title already has a note. Clicking it opens the notes dialog, which saves to the API when signed in. New notes start from a favorite, a drop or a list item instead.">
  <PrivateNotes {item} {note} signedIn datePreferences={preferences} />
</Specimen>

<NotesDialog bind:open bind:draft {item} privacy="public" onsave={() => open = false} />

<style>
.badge-example {
  position: relative;
  block-size: var(--line-height-computed);
}
</style>
