<!--
  OG's thin progress bar under a poster's quick icons,
  as a link to the progress page with OG's progress tooltip below it. With `ticks`, OG's exact bar: one segment per
  aired episode, filled where it's watched. Without, the standard bar, which fills the watched share from the left.
  `live` marks something being watched right now with a knob at the fill's end, like the watching-now player's
  scrubber. `watched` draws the summary watched button's bar instead, on poster cards (seasons, Up Next, progress's grid
  view): purple, rounded and apart from the quick icons, above the title, with no second bar in its tooltip. The link's
  name carries every tooltip line, so nothing lives only in the tooltip.
-->
<script lang="ts">
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import ProgressTip from './ProgressTip.svelte';
import type { WatchedProgress } from './WatchedProgress.ts';
import { watchedProgressText } from './watchedProgressText.ts';

interface Props {
  href: string;
  /** 0 to 100. */
  percent: number;
  /** Each aired episode, true when watched, for OG's exact bar (`.progress.ticks`). */
  ticks?: readonly boolean[];
  /** The tooltip: text for a live check-in, or `progressTooltip`'s runs (a rewatch has two, under a divider). */
  tip: string | readonly WatchedProgress[];
  /** Being watched now: a knob at the end of the fill. */
  live?: boolean;
  /** The summary watched button's bar, in place of Up Next's red one. Pair it with PosterCard's `detachedProgress`. */
  watched?: boolean;
}

const { href, percent, ticks, tip, live = false, watched = false }: Props = $props();

const label = $derived(typeof tip === 'string' ? tip.replaceAll('\n', ', ') : watchedProgressText(tip));
</script>

<!-- The progress page isn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet progressTip()}{#if typeof tip !== 'string'}<ProgressTip progress={tip} bar={!watched} />{/if}{/snippet}
<Tooltip content={typeof tip === 'string' ? tip : progressTip} placement="bottom">
  {#snippet trigger(tooltip)}
    <a class={['under-progress', { watched }]} {href} aria-label={label} {...tooltip}>
      <span class={['track', { full: percent >= 100, ticks: Boolean(ticks) }]}>
        {#if ticks}
          {#each ticks as seen, i (i)}
            <span class={['tick', { watched: seen }]}></span>
          {/each}
        {:else}
          <span class="fill" style:inline-size="{percent}%"></span>
          {#if live}<span class="knob" style:inset-inline-start="{percent}%"></span>{/if}
        {/if}
      </span>
    </a>
  {/snippet}
</Tooltip>

<style>
.under-progress {
  position: relative;
  display: block;
  block-size: var(--progress-under-height);

  /* Below only: above are the quick icons. */
  &::after {
    content: '';
    position: absolute;
    inset: 0 0 calc(-1 * var(--progress-under-hit-below));
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
  }

  /* Out of the flow: PosterCard's `detachedProgress` makes the room for it, on every card in the grid. */
  &.watched {
    --progress-bar: var(--brand-tertiary);
    --progress-under-bg: var(--color-watch-progress-track);
    block-size: var(--watch-progress-height);
    margin-block: var(--poster-progress-gap) calc(-1 * (var(--poster-progress-gap) + var(--watch-progress-height)));

    & .track {
      overflow: hidden;
      border-radius: var(--radius-watch-progress);
    }

    &::after {
      inset: calc(-1 * var(--poster-progress-gap)) 0;
    }
  }
}

.track {
  position: relative;
  display: block;
  block-size: 100%;
  background-color: var(--progress-under-bg);

  /* OG's `.progress[aria-valuenow="100"]`. */
  &.full {
    background-color: var(--progress-bar);
  }
}

/* OG's ticks share the bar evenly; an unwatched one lets the track show through. */
.ticks {
  display: flex;
}

.tick {
  flex: 1;
  transition: background-color var(--transition-card);

  &.watched {
    background-color: var(--progress-bar);
  }
}

.fill {
  display: block;
  block-size: 100%;
  background-color: var(--progress-bar);
  transition: inline-size var(--transition-card);
}

/* Decorative, like the watching-now player's: nothing can be scrubbed. */
.knob {
  position: absolute;
  inset-block-start: 50%;
  inline-size: var(--progress-under-knob);
  block-size: var(--progress-under-knob);
  border-radius: 50%;
  background-color: var(--progress-bar);
  box-shadow: var(--shadow-watching-knob);
  translate: -50% -50%;
  transition: inset-inline-start var(--transition-card);
}

@media (prefers-reduced-motion: reduce) {
  .fill,
  .knob,
  .tick {
    transition: none;
  }
}
</style>
