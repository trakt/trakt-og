<script lang="ts">
import Specimen from '#lib/design/Specimen.svelte';
import NoteManage from '#lib/components/notes/NoteManage.svelte';
import NotesDialog from '#lib/components/notes/NotesDialog.svelte';
import NoteRow from '#lib/components/notes/NoteRow.svelte';
import NoteStamp from '#lib/components/notes/NoteStamp.svelte';
import PrivateNotes from '#lib/components/summary/PrivateNotes.svelte';
import SectionToolbar from '#lib/components/toolbar/SectionToolbar.svelte';
import clock from '#lib/icons/regular/clock.svg?raw';
import heart from '#lib/icons/solid/heart.svg?raw';
import check from '#lib/icons/trakt/check-thick.svg?raw';
import collection from '#lib/icons/trakt/collection-thick.svg?raw';
import { noteRowsSchema } from '#lib/users/notes/noteRowsSchema.ts';
import { toNote } from '#lib/users/notes/toNote.ts';

let open = $state(false);
let draft = $state('');
const preferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const item = { type: 'movie', id: 1, slug: 'fight-club-1999', title: 'Fight Club', year: 1999 } as const;
const note = {
  id: 1,
  text: 'Watched this on a flight.\nDeserves a proper rewatch.',
  createdAt: '2026-09-20T12:00:00Z',
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
  {
    type: 'episode',
    show: { title: 'Andor', ids: { trakt: 2, slug: 'andor' } },
    episode: { title: 'Kassa', season: 1, number: 1, ids: { trakt: 5 } },
    attached_to: { type: 'episode' },
    note: {
      id: 5,
      notes: 'Slow first hour, worth it.',
      privacy: 'public',
      updated_at: '2026-09-25T21:00:00Z',
      user: { username: 'og_tester', name: 'OG Tester', ids: { slug: 'og_tester' } },
    },
  },
]);
</script>

<Specimen title="Section toolbar" bleed note="The notes page's toolbar, with its filter and summary slots.">
  <SectionToolbar>
    {#snippet filters()}Note type filter{/snippet}
    {#snippet summary()}5 notes · Added Date{/snippet}
  </SectionToolbar>
</Specimen>

<Specimen title="Note rows"
  note="Each note beside its poster: a spoiler, a long private one on a rating, a friends-only one on a play, one on a library item and one on an episode. Edit opens the notes dialog, with its delete icon at the start of the footer.">
  <div class="notes">
    {#each rows as row (row.note.id)}
      {@const note = toNote(row, preferences)}
      {#if note}
        <NoteRow {note} datePreferences={preferences}>
          {#snippet manage()}
            <NoteManage onedit={() => { draft = note.text; open = true; }} ondelete={() => {}} />
          {/snippet}
        </NoteRow>
      {/if}
    {/each}
  </div>
</Specimen>

<Specimen title="Note stamps"
  note="The dated box under a note, in its tone: a note card's watch, collect or rate date, and the summary box's Added or Updated.">
  <div class="stamps">
    <NoteStamp svg={check} glyph label="Watched" date="Sep 27, 2026 8:15 PM" tone="var(--color-note-tag-history)" />
    <NoteStamp svg={collection} glyph label="Collected" date="Sep 26, 2026 8:20 AM"
      tone="var(--color-note-tag-collection)" />
    <NoteStamp svg={heart} label="Rated 7" date="Sep 28, 2026 12:00 PM" tone="var(--color-note-tag-rating)" />
    <NoteStamp svg={clock} label="Updated" date="Sep 29, 2026" tone="var(--color-note-tag-date)"
      line="var(--color-comment-bubble-border)" />
  </div>
</Specimen>

<Specimen title="Private notes box"
  note="Under a movie, show, season, episode or person overview, only when it already has a note: the text with read more, then the Added or Updated stamp and the edit and delete icons under it. Edit opens the notes dialog. New notes start from a favorite, a drop or a list item instead.">
  <PrivateNotes {item} {note} signedIn datePreferences={preferences} />
  <PrivateNotes {item} note={{ ...note, id: 2, text: 'A long note with paragraphs.\n\n'.repeat(20), updatedAt: note.createdAt }} signedIn
    datePreferences={preferences} />
</Specimen>

<NotesDialog bind:open bind:draft {item} privacy="public" onsave={() => open = false} ondelete={() => open = false} />

<style>
.notes {
  padding-block: var(--note-padding);
}

.stamps {
  display: flex;
  flex-wrap: wrap;
  gap: var(--comment-stats-gap);
}
</style>
