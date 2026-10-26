<!--
  A grouped card's episodes: a pill with how many there are (or how many of them are watched once any are; just the
  numbers on a narrow card) that opens them in a popup. On the art (`onArt`) it's frosted in the top-right corner,
  with one tick per episode along the art's bottom edge that turns purple once watched. Elsewhere it's a plain
  outlined pill that sits in a line of text.
    <CalendarEpisodes group={entry.group} released={entry.released} onArt />
-->
<script lang="ts">
import PromptPopover from '$lib/components/prompt/PromptPopover.svelte';
import Icon from '$lib/icons/Icon.svelte';
import clone from '$lib/icons/regular/clone.svg?raw';
import chevron from '$lib/icons/solid/chevron-down.svg?raw';
import { overlay } from '$lib/overlay/overlay';
import EpisodeTray from './EpisodeTray.svelte';
import type { CalendarGroupCard } from './toCalendarGroupCard.ts';

interface Props {
  group: CalendarGroupCard['group'];
  released: boolean;
  onArt?: boolean;
}

const { group, released, onArt = false }: Props = $props();
const uid = $props.id();
let open = $state(false);

const watched = $derived(
  group.episodes.map((episode) =>
    overlay.state('episode', episode.id, { show: group.show.id, number: episode.season }).watched === true
  ),
);
const watchedCount = $derived(watched.filter(Boolean).length);
</script>

<button type="button" class={['episodes', { 'on-art': onArt, open }]} aria-expanded={open}
  aria-controls="{uid}-episodes" popovertarget="{uid}-episodes" style:anchor-name="--episodes-{uid}"
  title="{group.label}: {watchedCount} of {group.episodes.length} watched">
  <Icon svg={clone} /><span class="long">{watchedCount > 0 ? `${watchedCount}/${group.episodes.length} watched` : `${group
      .episodes.length} episodes`}</span><span class="short">{watchedCount > 0
      ? `${watchedCount}/${group.episodes.length}`
      : group.episodes.length}</span><Icon svg={chevron} />
</button>
{#if onArt}
  <span class="ticks" aria-hidden="true">{#each watched as done, i (i)}<i class:done></i>{/each}</span>
{/if}
<PromptPopover id="{uid}-episodes" anchor="--episodes-{uid}" tone="watched"
  ontoggle={(event) => (open = event.newState === 'open')}>
  {#snippet title()}<span class="popup-show">{group.show.title}</span><span class="popup-detail">Season {group
        .season} · {group.label}</span>{/snippet}
  {#if open}
    <EpisodeTray id="{uid}-tray" show={group.show.id} title={group.show.title} episodes={group.episodes} {released} />
  {/if}
</PromptPopover>

<style>
.episodes {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--space-xs-inline);
  min-block-size: 0;
  padding: 3px 8px 3px 9px;
  border: 1px solid var(--color-calendar-card-line);
  border-radius: var(--radius-sidebar-pill);
  background-color: var(--color-frame-page);
  color: var(--color-frame-ink);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-menu-header);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  & :global(.icon:last-child) {
    font-size: 0.75em;

    @media (prefers-reduced-motion: no-preference) {
      transition: rotate var(--transition-card);
    }
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--color-frame-ink-muted);
  }

  &.open {
    border-color: var(--color-frame-ink);
    background-color: var(--color-frame-ink);
    color: var(--color-frame-page);

    & :global(.icon:last-child) {
      rotate: 180deg;
    }
  }
}

/* Just the numbers, for a narrow card. */
.short {
  display: none;
}

/* Frosted in the art's top-right corner; white while the popup is open. */
.on-art {
  position: absolute;
  inset-block-start: var(--card-inset);
  inset-inline-end: var(--card-inset);
  z-index: 2;
  padding: 4px 8px 4px 9px;
  border-color: rgb(255 255 255 / 0.18);
  background-color: rgb(0 0 0 / 0.55);
  backdrop-filter: blur(6px);
  color: var(--color-frame-text);

  &:is(:hover, :focus-visible) {
    border-color: rgb(255 255 255 / 0.18);
    background-color: rgb(0 0 0 / 0.8);
  }

  &.open {
    border-color: var(--color-frame-text);
    background-color: var(--color-frame-text);
    color: var(--color-card-bg);
  }

  /* A narrow card (a month's day, a poster) keeps only the count. */
  @container (width < 200px) {
    & .long {
      display: none;
    }

    & .short {
      display: inline;
    }
  }
}

/* The popup's title bar: the show, then the season and what kind of drop it is. */
.popup-show {
  display: block;
}

.popup-detail {
  display: block;
  margin-block-start: 2px;
  font-size: var(--font-size-small);
  font-weight: normal;
  line-height: 1.2;
  opacity: 0.8;
}

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
</style>
