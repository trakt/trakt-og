<!--
  OG's thin progress bar under a poster's quick icons,
  as a link to the progress page with OG's progress tooltip below it. With `ticks`, OG's exact bar: one segment per
  aired episode, filled where it's watched. Without, the standard bar, which fills the watched share from the left.
  `live` marks something being watched right now with a knob at the fill's end, like the watching-now player's
  scrubber. The link's name carries every tooltip line, so nothing lives only in the tooltip.
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
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
}

const { href, percent, ticks, tip, live = false }: Props = $props();

const label = $derived(typeof tip === 'string' ? tip.replaceAll('\n', ', ') : watchedProgressText(tip));
</script>

<!-- The progress page isn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet progressTip()}{#if typeof tip !== 'string'}<ProgressTip progress={tip} bar={false} />{/if}{/snippet}
<Tooltip content={typeof tip === 'string' ? tip : progressTip} placement="bottom">
  {#snippet trigger(tooltip)}
    <a class="under-progress" {href} aria-label={label} {...tooltip}>
      <span class={['track', { full: percent >= 100, ticks: Boolean(ticks) }]}>
        {#if ticks}
          {#each ticks as watched, i (i)}
            <span class={['tick', { watched }]}></span>
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
  display: block;
  block-size: var(--progress-under-height);

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
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
