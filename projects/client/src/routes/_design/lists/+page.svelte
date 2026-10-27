<script lang="ts">
import OfficialListHeader from '$lib/components/lists/OfficialListHeader.svelte';
import EmptyState from '$lib/components/empty/EmptyState.svelte';
import WatchNowChips from '$lib/components/watchnow/WatchNowChips.svelte';
import DemoButton from '$lib/design/DemoButton.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import ListTransfer from '$lib/components/lists/ListTransfer.svelte';
import clone from '$lib/icons/regular/clone.svg?raw';
import fileExport from '$lib/icons/regular/file-export.svg?raw';
import { toBuiltInListView } from '$lib/lists/toBuiltInListView';
import MediaList from '$lib/components/lists/MediaList.svelte';
import BuiltInListDialog from '$lib/components/lists/BuiltInListDialog.svelte';
import NewListDialog from '$lib/components/lists/NewListDialog.svelte';
import ListItemEdit from '$lib/components/lists/ListItemEdit.svelte';
import ListReorderControls from '$lib/components/lists/ListReorderControls.svelte';
import RankInput from '$lib/components/lists/RankInput.svelte';
import ListRow from '$lib/components/media/ListRow.svelte';
import NotesDialog from '$lib/components/notes/NotesDialog.svelte';
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import SectionToolbar from '$lib/components/toolbar/SectionToolbar.svelte';
import ListItemPoster from '$lib/lists/ListItemPoster.svelte';
import ListManageBar from '$lib/lists/ListManageBar.svelte';
import ListStats from '$lib/lists/ListStats.svelte';
import type { ListItemCard } from '$lib/lists/toListItemCard';
import type { ListStatsItem } from '$lib/lists/toListStats';
import type { OverlayState } from '$lib/overlay/createOverlay.svelte';

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const BLANK = ' ';
const cover = 'https://media.trakt.tv/images/shows/000/099/080/fanarts/full/a049f455c1.jpg.webp';

// Near the 500-character limit, taller than the poster, so it scrolls.
const longNotes = [
  'Still the best haunted-house movie set in space. Watched it again on the 4K disc and it looks like it was shot last year.',
  "The pacing is the point: almost an hour before the chestburster, and every minute of the slow build pays off. Ripley isn't the lead until the last act, which still surprises people. Skip the director's cut, the theatrical version is tighter. Pair it with Aliens for a double feature, then stop there.",
].join('\n\n');

const card = (key: number, title: string, slug: string, extra: Partial<ListItemCard> = {}): ListItemCard => {
  const href = `/movies/${slug}`;
  return {
    key,
    type: 'movie',
    id: key,
    href,
    title,
    rank: key,
    rating: 8.1,
    lines: [{ text: BLANK, href }, { text: BLANK, href }],
    noteTitle: { title },
    ...extra,
  };
};
const heat = card(3, 'Heat', 'heat-1995', {
  notes: "Watch the **director's cut** :fire:",
  lines: [{ rating: 8.19, votes: 12_400, href: '/movies/heat-1995' }, { text: BLANK, href: '/movies/heat-1995' }],
});
const alien = card(4, 'Alien', 'alien-1979', { notes: longNotes });
const aliens = card(5, 'Aliens', 'aliens-1986');

let notesOpen = $state(false);
let notesDraft = $state('');
let notesItem = $state<ListItemCard>(alien);
const editNotes = (item: ListItemCard) => {
  notesItem = item;
  notesDraft = item.notes ?? '';
  notesOpen = true;
};

let ranks = $state<Record<number, number>>({ 3: 3, 4: 7 });
const clamp = (next: number) => Math.max(1, Math.min(12, next));
const move = (item: ListItemCard, next: number) => (ranks[item.key] = clamp(next));
const managed = $derived([heat, alien].map((item) => ({ ...item, rank: ranks[item.key] ?? item.rank })));

let open = $state(false);
let builtInOpen = $state(false);
let rank = $state(2);
const transferSource = toBuiltInListView({
  kind: 'watchlist',
  profile: { slug: 'og_tester', isPrivate: false },
  id: 13,
  itemCount: 12,
  commentCount: 0,
  sort: { by: 'rank', how: 'asc' },
});

// A signed-in viewer's stats bar, against a made-up library: 2 of 10 watched, 5 collected, then all of a 3-item list.
const items: ListStatsItem[] = Array.from({ length: 10 }, (_, i) => ({ type: 'movie', id: i + 1 }));
const library = (_: string, id: number): OverlayState => ({ watched: id <= 2, collected: id <= 5 });
const everything = (): OverlayState => ({ watched: true, collected: true });
const never = new Promise<null>(() => {});
const likeTarget = { id: 23, ownerSlug: 'og_tester', viewer: 'og_viewer' };
let mode = $state<'add' | 'edit' | 'unavailable'>('add');
const initial = {
  name: 'Sci-Fi Club',
  description: 'Picks for the monthly club.',
  privacy: 'link',
  allow_comments: true,
  display_numbers: true,
  sort_by: 'rank',
  sort_how: 'asc',
  collaborators: ['teodoro_2'],
};
const following = [{ slug: 'teodoro_2', name: 'Elsy Murphy (@teodoro_2)' }];
</script>

{#snippet edit(item: ListItemCard)}
  <RankInput name={item.title} rank={item.rank} onmove={(next) => move(item, next)} />
  <ListItemEdit name={item.title} rank={item.rank} total={12} notes={Boolean(item.notes)} draggable changeRank={false}
  onmove={(next) => move(item, next)} ondrag={() => {}} onchangerank={() => {}} onremove={() => {}}
  onnotes={() => editNotes(item)} />
{/snippet}

{#snippet none()}{/snippet}

<!-- The OG references are screenshots on og-shots, outside the app. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<Specimen title="List picker"
  note="The summary's list button, then the new list and edit list dialogs, and a watchlist's edit dialog. Collaborator routes are Official-only, so another app's client ID edits without them.">
  <p>
    Local OG references: <a href="https://og-shots.trakt.tv/135/2d64380a-rails-add.png">Add list</a>,
    <a href="https://og-shots.trakt.tv/135/68548be2-rails-edit.png">Edit list</a> and
    <a href="https://og-shots.trakt.tv/135/5e5d9cba-rails-delete.png">Delete confirmation</a>.
  </p>
  <div class="sample">
    <MediaList target={{ type: 'movie', id: 1, title: 'Fight Club' }} variant="summary" />
  </div>
  <div class="buttons">
    <DemoButton onclick={() => { mode = 'add'; open = true; }}>Preview add</DemoButton>
    <DemoButton onclick={() => { mode = 'edit'; open = true; }}>Preview edit</DemoButton>
    <DemoButton onclick={() => { mode = 'unavailable'; open = true; }}>Preview edit, no collaborators</DemoButton>
    <DemoButton onclick={() => builtInOpen = true}>Preview watchlist edit</DemoButton>
  </div>
</Specimen>

<Specimen title="Official list header" bleed note="The cover over an official Trakt list, on its first item's fanart.">
  <OfficialListHeader image={cover} />
</Specimen>

<Specimen title="Notes on posters"
  note="The owner sees an edit button on notes and an Add Note pill when hovering a poster without notes. Long notes scroll.">
  <Variant label="Owner">
    <PosterGrid>
      {#each [heat, alien, aliens] as item (item.key)}
        <ListItemPoster {item} rank={item.rank} {datePreferences} oneditnotes={editNotes} />
      {/each}
    </PosterGrid>
  </Variant>
  <Variant label="Visitor">
    <PosterGrid>
      {#each [heat, alien, aliens] as item (item.key)}
        <ListItemPoster {item} rank={item.rank} {datePreferences} />
      {/each}
    </PosterGrid>
  </Variant>
</Specimen>

<Specimen title="Manage mode" bleed
  note="Rank inputs and the edit tiles on each poster, then the bar with copy, move, reset and delete.">
  <div class="padded managing">
    <PosterGrid>
      {#each managed as item (item.key)}
        <ListItemPoster {item} {datePreferences} {edit} oneditnotes={editNotes} />
      {/each}
    </PosterGrid>
  </div>
  <ListManageBar count={12} busy={false} onreset={() => {}} ondelete={() => {}}>
    {#snippet transfers()}
      <ListTransfer source={{ ...transferSource, kind: 'personal', name: 'All-Time Favorites' }}
        query={{ types: [], genres: [], page: 1, limit: 120 }} sort={{ by: 'rank', how: 'asc' }} count={12} svg={clone}
        managing />
      <ListTransfer source={{ ...transferSource, kind: 'personal', name: 'All-Time Favorites' }}
        query={{ types: [], genres: [], page: 1, limit: 120 }} sort={{ by: 'rank', how: 'asc' }} count={12}
        svg={fileExport} managing move />
    {/snippet}
  </ListManageBar>
</Specimen>

<Specimen title="Lists index reorder" note="The arrows and drag handle on a row of the owner's lists index.">
  <ListRow href="/users/og_tester/lists/all-time-favorites" name="All-Time Favorites"
    owner={{ name: 'OG Tester', href: '/users/og_tester' }} posters={[{}, {}, {}, {}, {}]} itemCount={12}
    likeCount={3} likeTarget={{ id: 23, ownerSlug: 'og_tester', viewer: 'og_tester' }}>
    {#snippet reorderControls()}
      <ListReorderControls name="All-Time Favorites" {rank} total={5}
        onmove={(next) => rank = Math.max(1, Math.min(5, next))} ondrag={() => {}} />
    {/snippet}
  </ListRow>
</Specimen>

<Specimen title="List stats bar" bleed
  note="Watched and Collected show only to a signed-in viewer on a list that isn't official.">
  <div class="states">
    <Variant label="Signed in, 2 of 10 watched, 5 collected">
      <SectionToolbar filters={none}>
        {#snippet stats()}
          <ListStats itemCount={10} stats={{ count: 10, runtime: 3844, items }} progress stateOf={library} likeCount={0}
            {likeTarget} comments={{ count: 0, href: '/users/og_tester/lists/heist-night/comments' }} />
        {/snippet}
      </SectionToolbar>
    </Variant>
    <Variant label="All of a 3-item list">
      <SectionToolbar filters={none}>
        {#snippet stats()}
          <ListStats itemCount={3} stats={{ count: 3, runtime: 481, items: items.slice(0, 3) }} progress
            stateOf={everything} likeCount={1_204} {likeTarget}
            comments={{ count: 12, href: '/users/og_tester/lists/heist-night/comments' }} />
        {/snippet}
      </SectionToolbar>
    </Variant>
    <Variant label="Stats still loading">
      <SectionToolbar filters={none}>
        {#snippet stats()}
          <ListStats itemCount={1_523} stats={never} progress stateOf={library} likeCount={3} {likeTarget} />
        {/snippet}
      </SectionToolbar>
    </Variant>
    <Variant label="Signed out">
      <SectionToolbar filters={none}>
        {#snippet stats()}
          <ListStats itemCount={57} stats={{ count: 57, runtime: 6012 }} likeCount={3}
            likeTarget={{ ...likeTarget, viewer: null }} />
        {/snippet}
      </SectionToolbar>
    </Variant>
  </div>
</Specimen>

<Specimen title="Applied streaming filters" bleed>
  <WatchNowChips tiles={[
    { kind: 'bundle', id: 'subscriptions', name: 'Streaming Subscriptions', country: 'US' },
    { kind: 'service', id: 'netflix', source: { name: 'Netflix', color: '#e50914' } },
  ]} />
</Specimen>

<Specimen title="Item's lists, empty"
  note="A title's lists page with nothing for the picked type is filtered out, with a link back to all lists.">
  <EmptyState action={{ href: '/movies/holes-2003/lists/all', text: 'See all lists' }} />
</Specimen>

<NotesDialog bind:open={notesOpen} bind:draft={notesDraft} item={notesItem.noteTitle} privacy="public"
  onsave={() => notesOpen = false} />
<BuiltInListDialog bind:open={builtInOpen} kind="watchlist" count={12} busy={false} description={undefined}
  sortBy="rank" sortHow="asc" onsave={() => builtInOpen = false} />
{#if open}
  {#if mode === 'add'}
    <NewListDialog bind:open title="Add to new list" {following} onsave={() => open = false} />
  {:else}
    <NewListDialog bind:open {following} initial={mode === 'unavailable' ? { ...initial, collaborators: [] } : initial}
  editing count={12}
  shareLink="https://trakt.tv/lists/share/sci-fi-club" collaboratorsUnavailable={mode === 'unavailable'}
  onsave={() => open = false} />
  {/if}
{/if}

<style>
.sample {
  max-inline-size: var(--list-picker-width);
  margin-block: var(--gutter);
}

.padded {
  padding-inline: var(--design-canvas-padding);
}

/* The list page dims the quick icons while managing. */
.managing :global(.quick-icons > *) {
  opacity: var(--opacity-list-manage-quick-icons);
}

.states {
  display: grid;
  gap: var(--gutter);
  padding-block-start: var(--gutter);

  & :global(figcaption) {
    padding-inline: var(--design-canvas-padding);
  }
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm-inline);
}
</style>
