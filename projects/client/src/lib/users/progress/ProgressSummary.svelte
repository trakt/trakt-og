<!--
  The summary strip on the right of the progress subnav, each icon in its meaning color with the number in white and
  the word in gray: on Watched, the percent
  watched with "133/154 episodes" under it on hover and the time left with its episode count; on Library, the
  percent in your library. Then the show count. Until the rows are computed the strip keeps to the show count. The
  time left reads "~" while it's an estimate from show runtimes.
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import clock from '$lib/icons/regular/clock.svg?raw';
import file from '$lib/icons/regular/file.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import collection from '$lib/icons/trakt/collection-thick.svg?raw';
import { formatRuntime } from '$lib/utils/formatRuntime';
import type { ProgressTotals } from './ProgressTotals.ts';
import type { ProgressType } from './progressTypes.ts';

interface Props {
  type: ProgressType;
  /** Every show on every page. */
  shows: number;
  totals: ProgressTotals | null;
}

const { type, shows, totals }: Props = $props();

const number = (n: number) => n.toLocaleString('en-US');
const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;
</script>

{#snippet stat(label: string, svg: string, value: string, noun: string, under: string, kind = '')}
  <Tooltip text={label}>
    {#snippet trigger(tooltip)}
      <!-- A focus stop so the tooltip and the count under it show from the keyboard too. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <span class={['stat', kind]} tabindex="0" {...tooltip}>
        <span class="icon-slot"><Icon {svg} /></span><span class="text-wrapper"><strong>{value}</strong> {noun}<span
            class="under-count"
          >{under}</span></span>
      </span>
    {/snippet}
  </Tooltip>
{/snippet}

<div class="progress-summary">
  {#if totals}
    {#if type === 'watched'}
      {@render stat('Watched', check, `${totals.percent}%`, 'watched',
        `${number(totals.completed)}/${number(totals.aired)} ${plural(totals.aired, 'episode')}`, 'watched')}
      {@render stat('Time left to watch', clock, `${totals.exact ? '' : '~'}${formatRuntime(totals.minutesLeft)}`, 'left',
        `${number(totals.left)} ${plural(totals.left, 'episode')}`, 'time')}
    {:else}
      {@render stat('Added to Library', collection, `${totals.percent}%`, 'in library',
        `${number(totals.completed)}/${number(totals.aired)} ${plural(totals.aired, 'episode')}`, 'library')}
    {/if}
  {/if}
  <Tooltip text={plural(shows, 'Show')}>
    {#snippet trigger(tooltip)}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <span class="stat shows" tabindex="0" {...tooltip}>
        <span class="icon-slot"><Icon svg={file} /></span><strong>{number(shows)}</strong><span class="noun">{plural(shows, 'show')}</span>
      </span>
    {/snippet}
  </Tooltip>
</div>

<style>
/* `.comment-wrapper.interactions` with `a.alt`. */
.progress-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-stats);
  min-inline-size: 0;
  color: var(--color-stat-noun);
  font-family: var(--font-headings);
  font-size: var(--font-size-stat-noun);
  white-space: nowrap;
}

.stat {
  display: inline-flex;
  align-items: center;
  color: inherit;
}

.noun {
  margin-inline-start: var(--space-stat-noun);
}

strong {
  color: var(--color-stat-number);
  font-size: var(--font-size-stat-number);
  font-weight: var(--font-weight-headings-heavy);
}

.icon-slot {
  display: inline-flex;
  margin-inline-end: var(--space-stat);
  color: var(--color-stat-count);
  font-size: var(--font-size-stat-icon);
  line-height: 1;

  .watched & {
    color: var(--color-stat-watched);
  }

  .library & {
    color: var(--color-stat-collected);
  }
}

.text-wrapper {
  text-transform: none;
}

.text-wrapper {
  display: inline-block;
  position: relative;
}

.under-count {
  position: absolute;
  inset-block-end: var(--list-stat-under-offset);
  inset-inline-start: 0;
  color: var(--color-list-stat-under);
  font-size: var(--font-size-list-stat-under);
  text-transform: none;
  opacity: 0;
  transition: opacity 0.5s;

  .stat:is(:hover, :focus-visible) & {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .under-count {
    transition: none;
  }
}
</style>
