<!--
  A show's progress tooltip, in the summary watched button's words: "3% watched" over "1 / 32 eps — 1 play (49m)", with
  the summary's progress bar in the tooltip's footer. A rewatch shows its own run over the whole show's, each with its
  bar in a footer band under it. Leave the bar off (`bar={false}`) when the tooltip is for a progress bar already.
  `library` colors the bar like the summary's library one, and `footer` adds to the footer under it (the library's
  format and audio).
    <Tooltip content={tip}>{#snippet tip()}<ProgressTip progress={fill.tips.watched} />{/snippet}</Tooltip>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import TooltipFooter from '$lib/components/tooltip/TooltipFooter.svelte';
import { formatRuntime } from '$lib/utils/formatRuntime';
import type { WatchedProgress } from './WatchedProgress.ts';
import { watchedProgressDetail } from './watchedProgressDetail.ts';

interface Props {
  progress: readonly WatchedProgress[];
  bar?: boolean;
  library?: boolean;
  footer?: Snippet;
}

const { progress, bar = true, library = false, footer }: Props = $props();
const last = $derived(progress.at(-1));
</script>

{#snippet meter(percent: number)}<span class={['bar', { library }]} style:--percent="{percent}%"></span>{/snippet}

<span class={['progress-tip', { barred: bar }]}>
  {#each progress as run (run.verb)}
    <span class="run">
      <span><b>{run.percent}%</b> {run.verb}</span>
      <span class="detail">{watchedProgressDetail(run)} {#if run.plays !== undefined && run.minutes}<em
          >({formatRuntime(run.minutes)})</em>{/if}</span>
    </span>
    {#if bar && run !== last}<TooltipFooter between>{@render meter(run.percent)}</TooltipFooter>{/if}
  {/each}
  {#if bar || footer}
    <TooltipFooter>
      {#if bar && last}{@render meter(last.percent)}{/if}
      {@render footer?.()}
    </TooltipFooter>
  {/if}
</span>

<style>
.progress-tip {
  display: grid;

  /* With its bar, wide enough that a short run's bar still reads, and the same width from tip to tip. */
  &.barred {
    min-inline-size: var(--tooltip-progress-min-width);
  }
}

.run {
  display: grid;
  padding: var(--space-tooltip-rich);

  & b {
    font-weight: var(--font-weight-headings-heavy);
  }
}

.run + .run {
  margin-block-start: var(--space-tooltip-divider);
  padding-block-start: var(--space-tooltip-divider);
  border-block-start: 1px solid var(--color-tooltip-divider);
}

.detail {
  color: var(--color-tooltip-muted);
}

/* The summary watched button's purple on its dark track, shaped like the monthly stats tooltip's bar. The library's is
   green. */
.bar {
  --fill: var(--brand-tertiary);
  block-size: var(--tooltip-progress-height);
  border-radius: var(--tooltip-progress-height);
  background: linear-gradient(
    to right,
    var(--fill) var(--percent),
    var(--color-tooltip-progress-track) var(--percent)
  );

  &.library {
    --fill: var(--brand-quaternary);
  }
}
</style>
