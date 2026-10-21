<!--
  One list item as a poster card: the poster, the
  quick icons, the title and OG's two sort-dependent lines, and the owner's notes over the poster. With `oneditnotes`, a
  poster without notes shows an Add Note pill on hover, and open notes carry an edit button. The list page and the dashboard's Watchlist panel both render
  these.
-->
<script lang="ts">
import { matchesListFade } from '$lib/lists/matchesListFade';
import NotesPill from '$lib/components/lists/NotesPill.svelte';
import ReadNotes from '$lib/components/lists/ReadNotes.svelte';
import PosterCard from '$lib/components/media/PosterCard.svelte';
import { quickIconFill } from '$lib/components/media/quickIconFill';
import plus from '$lib/icons/solid/plus.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { Snippet } from 'svelte';
import type { ListItemCard } from './toListItemCard.ts';

interface Props {
  item: ListItemCard;
  /** Shown when the list displays its numbers. */
  rank?: number;
  /** Page-local eye-menu fade choices; dashboard cards default to none. */
  fade?: readonly string[];
  datePreferences: DatePreferences;
  /** The card leaves with the removal transition. */
  removing?: () => boolean;
  /** Manage mode's controls over the poster, in place of Read Notes. */
  edit?: Snippet<[ListItemCard]>;
  /** Someone who can edit the list: a poster without notes offers to add some, and open notes to edit them. */
  oneditnotes?: (item: ListItemCard) => void;
  /** PosterCard's `framed`: rounded, with the quick icons on their own panel. On unless set to false. */
  framed?: boolean;
}

const { item, rank, datePreferences, removing, edit, oneditnotes, fade = [], framed = true }: Props = $props();
const state = $derived(item.type === 'person' ? undefined : overlay.state(item.type, item.id, item.seasonOf));
const fill = $derived(quickIconFill({ state: state ?? {}, airedEpisodes: item.airedEpisodes, datePreferences }));
</script>

<PosterCard
  {framed}
  href={item.href}
  title={item.title}
  number={item.number}
  image={item.image}
  episodeBadge={item.episodeBadge}
  subtitles={item.lines}
  faded={fade.some((option) => matchesListFade({ option, notes: item.notes, state: state ?? {}, fill }))}
  userRating={state?.rating}
  {rank}
  {removing}
  icons={item.type === 'person'
    ? undefined
    : {
      fill,
      rating: item.rating,
      ratingTarget: { type: item.type, id: item.id, title: item.title },
      watchTarget: { type: item.type, id: item.id, title: item.title, airedEpisodes: item.airedEpisodes,
        season: item.seasonOf },
      watchNow: 'play',
      listLabel: item.type === 'movie' || item.type === 'show' ? 'Add to watchlist' : 'Add to list',
    }}
>
  {#snippet posterOverlay()}
    {#if edit}{@render edit(item)}{:else if item.notes}<ReadNotes notes={item.notes} onedit={oneditnotes && (() => oneditnotes(item))} />{:else if oneditnotes}<div
        class="add-notes"
      ><NotesPill add svg={plus} label="Add Note" aria-label="Add Note to {item.title}" onclick={() => oneditnotes(item)} /></div>{/if}
  {/snippet}
</PosterCard>

<style>
/* Shows while the poster is hovered or the pill has keyboard focus; touch screens add notes in manage mode. */
.add-notes {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;

  & :global(.notes-pill) {
    opacity: 0;
    pointer-events: none;
  }

  & :global(.notes-pill:focus-visible) {
    opacity: 1;
  }
}

@media (hover: hover) {
  :global(:hover) > .add-notes :global(.notes-pill) {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
