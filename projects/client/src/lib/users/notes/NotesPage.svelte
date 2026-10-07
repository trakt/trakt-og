<script lang="ts">
import { SvelteURLSearchParams } from 'svelte/reactivity';
import { page } from '$app/state';
import Container from '$lib/components/container/Container.svelte';
import Dropdown from '$lib/components/dropdown/Dropdown.svelte';
import NoData from '$lib/components/empty/NoData.svelte';
import { tick } from 'svelte';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import { removeNote } from '$lib/components/notes/removeNote';
import NoteManage from '$lib/components/notes/NoteManage.svelte';
import NotesDialog from '$lib/components/notes/NotesDialog.svelte';
import { toast } from '$lib/components/toast/toast.svelte';
import type { NoteView } from '$lib/users/notes/NoteView';
import { createNoteOverlay } from '$lib/users/notes/createNoteOverlay.svelte';
import NoteRow from '$lib/components/notes/NoteRow.svelte';
import Pagination from '$lib/components/pagination/Pagination.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import SubnavCount from '$lib/components/toolbar/SubnavCount.svelte';
import memo from '$lib/icons/regular/memo.svg?raw';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { ProfileUser } from '$lib/users/ProfileUser';
import type { loadNotes } from '$lib/users/notes/loadNotes';
import { noteTypes } from '$lib/users/notes/noteTypes';

type Props = {
  data: Awaited<ReturnType<typeof loadNotes>> & {
    profile: ProfileUser;
    datePreferences: DatePreferences;
    isSelf: boolean;
  };
};
const { data }: Props = $props();
const edits = createNoteOverlay();
let editing = $state<NoteView | null>(null);
let open = $state(false);
let draft = $state('');
let section = $state<HTMLElement>();
const notes = $derived(data.notes.flatMap((note) => {
  const current = edits.state(note);
  return current ? [current] : [];
}));
const removed = $derived(data.notes.length - notes.length);
$effect(() => {
  // Clear optimistic edits and discard late writes when loader data or owner context changes.
  void data.notes;
  void data.isSelf;
  edits.clear();
  open = false;
  editing = null;
});
function edit(note: NoteView) {
  editing = note;
  draft = note.text;
  open = true;
}
async function refocus() {
  await tick();
  const active = document.activeElement;
  if (active && active !== document.body && active.checkVisibility() && !active.closest('[inert]')) return;
  const next = section?.querySelector<HTMLElement>('[data-note-row]:not([inert]) .note-manage button');
  (next ?? section)?.focus({ preventScroll: true });
}
async function save(note: NoteView, text: string) {
  if (!data.isSelf) return;
  open = false;
  const result = await edits.save({
    note,
    text,
    fetch: authenticatedFetch({ manager: userManager() }),
    datePreferences: data.datePreferences,
    now: new Date().toISOString(),
  });
  if (result && !result.ok) toast.error(result.message);
  if (result?.ok && text.trim()) toast.success('Notes saved!');
  if (result && !text.trim()) void refocus();
}
const metaType = $derived(
  data.type === 'all'
    ? ''
    : `${data.type === 'collection' ? 'library' : data.type === 'people' ? 'person' : data.type.replace(/s$/, '')} `,
);
const title = $derived(`${data.profile.displayName}'s ${metaType}notes`);
type NoteType = keyof typeof noteTypes;
// The type menu's sections: All Types alone, the media items, then the profile's own activities.
const noteGroups = $derived<readonly { header?: string; types: readonly NoteType[] }[]>([
  { types: ['all'] },
  { header: 'Media Items', types: ['movies', 'shows', 'seasons', 'episodes', 'people'] },
  { header: `${data.profile.firstName}'s activities`, types: ['history', 'collection', 'ratings'] },
]);
const filterHref = (type: string) => {
  const query = new SvelteURLSearchParams(page.url.searchParams);
  query.delete('page');
  const search = query.size ? `?${query}` : '';
  return `/users/${data.profile.slug}/notes${type === 'all' ? '' : `/${type}`}${search}`;
};
</script>

<!-- Filter URLs keep the canonical profile slug and the current page size. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<svelte:head>
  <title>{title} - Trakt</title>
  <meta name="description" content="Check out {data.profile.firstName}'s recent notes." />
</svelte:head>

<SectionToolbar>
  {#snippet filters()}
    <Dropdown label="Note type">
      {#snippet trigger()}{noteTypes[data.type]}{/snippet}
      {#each noteGroups as { header, types }, i (header ?? 'all')}
        {#if i > 0}<hr />{/if}
        <ul>
          {#if header}<li class="header" role="presentation">{header}</li>{/if}
          {#each types as type (type)}
            <li><a href={filterHref(type)} aria-current={data.type === type ? 'page' : undefined}>{noteTypes[type]}</a></li>
          {/each}
        </ul>
      {/each}
    </Dropdown>
  {/snippet}
  {#snippet stats()}
    <SubnavCount svg={memo} count={Math.max(0, data.itemCount - removed)} noun="note" tooltip="Notes" />
  {/snippet}
  {#snippet summary()}
    <Dropdown label="Sort notes">
      {#snippet trigger()}Added Date{/snippet}
      <ul><li><a href={page.url.pathname + page.url.search} aria-current="page">Added Date</a></li></ul>
    </Dropdown>
  {/snippet}
</SectionToolbar>
<section class="notes" aria-label={title} bind:this={section} tabindex="-1">
  <Container>
    {#if data.page.type === 'paginated'}<Pagination meta={data.page} label="Notes pages" />{/if}
    {#each notes as note (note.id)}
      <div data-note-row out:removeNote onoutroend={refocus}>
      <NoteRow {note} datePreferences={data.datePreferences}>
        {#snippet manage()}
          {#if data.isSelf && note.author.href === `/users/${data.profile.slug}`}
            <NoteManage busy={edits.busy(note.id)} onedit={() => edit(note)} ondelete={() => save(note, '')} />
          {/if}
        {/snippet}
      </NoteRow>
      </div>
    {:else}<NoData />{/each}
    {#if data.page.type === 'paginated'}<Pagination meta={data.page} label="Notes pages" />{/if}
  </Container>
</section>
{#if editing && data.isSelf}
  <NotesDialog bind:open bind:draft item={editing.item} onsave={(text) => { if (editing) void save(editing, text); }} />
{/if}

<style>
.notes {
  padding-block: var(--note-padding);
}
.notes :global(nav) {
  margin-block: var(--space-panel);
}
/* The top pagination sits right under the section's own padding, like History's. */
.notes :global(nav:first-child) {
  margin-block-start: 0;
}
</style>
