<!--
  One calendar card in either view, with og's full quick-icon bar under the artwork whatever the artwork style. A card
  that groups a show's episodes from one day shows its episode count on the art, a strip that fills purple as they're
  watched, and opens to its episodes.
    <CalendarEntryCard {entry} icons={cardIcons(entry)} artwork="logo" />
-->
<script lang="ts">
import FanartCard from '$lib/components/media/FanartCard.svelte';
import type QuickIcons from '$lib/components/media/QuickIcons.svelte';
import TextMediaCard from '$lib/components/media/TextMediaCard.svelte';
import Icon from '$lib/icons/Icon.svelte';
import clone from '$lib/icons/regular/clone.svg?raw';
import chevron from '$lib/icons/solid/chevron-down.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import type { ComponentProps } from 'svelte';
import type { CalendarArtwork } from './calendarDisplay.ts';
import type { CalendarEntry } from './CalendarEntry.ts';
import EpisodeTray from './EpisodeTray.svelte';

interface Props {
  entry: CalendarEntry;
  icons: Omit<ComponentProps<typeof QuickIcons>, 'small'>;
  artwork: CalendarArtwork;
  /** A month cell: an episode shows only its number, since the cell is narrow; movies keep their title. */
  compact?: boolean;
}

const { entry, icons, artwork, compact = false }: Props = $props();
const uid = $props.id();
let open = $state(false);

const group = $derived('group' in entry ? entry.group : undefined);
const watched = $derived(
  group?.episodes.map((episode) =>
    overlay.state('episode', episode.id, { show: group.show.id, number: episode.season }).watched === true
  ) ?? [],
);
const watchedCount = $derived(watched.filter(Boolean).length);
const shownTitle = $derived(compact && entry.episode ? '' : entry.title);
</script>

<div class={['calendar-entry', { grouped: group }]}>
  {#if artwork === 'none'}
    <TextMediaCard {...entry} title={shownTitle} compact={compact} {icons} />
  {:else}
    <FanartCard {...entry} title={shownTitle} episodeBadge={undefined} userRating={entry.state.rating} {icons}>
      {#snippet fanartOverlay()}
        {#if group}
          <button type="button" class="count" aria-expanded={open} aria-controls="{uid}-tray"
            title="{group.label}: {watchedCount} of {group.episodes.length} watched" onclick={() => (open = !open)}>
            <Icon svg={clone} /><b>{group.episodes.length}</b><span class="watched">· {watchedCount}/{group.episodes
                .length} watched</span><Icon svg={chevron} />
          </button>
          <span class="ticks" aria-hidden="true">{#each watched as done, i (i)}<i class:done></i>{/each}</span>
        {/if}
      {/snippet}
    </FanartCard>
  {/if}
  {#if group && artwork === 'none'}
    <button type="button" class="count text" aria-expanded={open} aria-controls="{uid}-tray" onclick={() => (open = !open)}>
      <Icon svg={clone} /><b>{group.episodes.length}</b><span class="watched">· {watchedCount}/{group.episodes.length}
        watched</span><Icon svg={chevron} />
    </button>
  {/if}
  {#if group && open}
    <EpisodeTray id="{uid}-tray" show={group.show.id} title={group.show.title} episodes={group.episodes} />
  {/if}
</div>

<style>
.calendar-entry {
  position: relative;
  container-type: inline-size;
  min-inline-size: 0;

  &.grouped :global(.fanart) {
    box-shadow: inset 0 3px 0 var(--brand-tertiary);
  }
}

.calendar-entry :global(.fanart .logo) {
  max-inline-size: var(--calendar-logo-max-width);
}

.count {
  position: absolute;
  inset-block-start: var(--space-sm-block);
  inset-inline-end: var(--space-sm-block);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  min-block-size: 0;
  padding: 3px 7px;
  border: 0;
  border-radius: var(--radius-sm);
  background-color: rgb(0 0 0 / 0.72);
  color: var(--color-frame-text);
  font-size: var(--font-size-small);
  cursor: pointer;

  & :global(.icon:last-child) {
    font-size: 0.7em;

    @media (prefers-reduced-motion: no-preference) {
      transition: rotate var(--transition-card);
    }
  }

  &[aria-expanded='true'] {
    background-color: var(--brand-tertiary);

    & :global(.icon:last-child) {
      rotate: 180deg;
    }
  }

  &:is(:hover, :focus-visible) {
    background-color: rgb(0 0 0 / 0.9);
  }

  &.text {
    position: static;
    margin: 0 var(--space-sm-inline) var(--space-sm-block);
  }

  @container (width < 260px) {
    & .watched {
      display: none;
    }
  }
}

.watched {
  color: var(--color-sidebar-pill-text);
}

/* One tick per episode along the art's bottom edge, purple once watched. */
.ticks {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  z-index: 2;
  display: flex;
  gap: 2px;
  block-size: 4px;

  & i {
    flex: 1;
    background-color: rgb(255 255 255 / 0.28);
  }

  & i.done {
    background-color: var(--brand-tertiary);
  }
}

/* Narrow cards (a month's day, a poster) keep every quick icon, just smaller. */
@container (width < 300px) {
  .calendar-entry.calendar-entry :global(.quick-icons) {
    --bar: 34px;
    --watch-card-height: 34px;
    --watch-card-small-height: 34px;
    --list-card-height: 34px;
    --list-card-small-height: 34px;
    --action-width: 26px;
    --watch-card-width: 26px;
    --watch-card-small-width: 26px;
    --list-card-width: 26px;
    --list-card-small-width: 26px;
    --font-size-quick-icon: 16px;
    --font-size-quick-icon-small: 15px;
    --font-size-rating: 14px;
    --font-size-rating-small: 13px;
    --font-size-rating-heart: 13px;
  }
}

@container (width < 190px) {
  .calendar-entry.calendar-entry :global(.quick-icons) {
    --action-width: 21px;
    --watch-card-width: 21px;
    --watch-card-small-width: 21px;
    --list-card-width: 21px;
    --list-card-small-width: 21px;
    --font-size-quick-icon: 13px;
    --font-size-quick-icon-small: 13px;
    --font-size-rating: 12px;
    --font-size-rating-small: 12px;
    --font-size-rating-heart: 11px;
  }
}

@container (width < 172px) {
  .calendar-entry.calendar-entry :global(.quick-icons) {
    --action-width: 19px;
    --watch-card-width: 19px;
    --watch-card-small-width: 19px;
    --list-card-width: 19px;
    --list-card-small-width: 19px;
    --font-size-quick-icon: 12px;
    --font-size-quick-icon-small: 12px;
    --font-size-rating: 11px;
    --font-size-rating-small: 11px;
    --font-size-rating-heart: 10px;
  }
}
</style>
