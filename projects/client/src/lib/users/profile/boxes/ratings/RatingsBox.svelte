<!--
  Ratings: the spread from 1 to 10 with the most used score in full white, the average as a dotted line where it falls
  (the profile chart's way), each bar's share of all ratings in its tooltip, and the latest 10 in the band.
-->
<script lang="ts">
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import ProfileBox from '#lib/components/users/profile-box/ProfileBox.svelte';
import heart from '#lib/icons/solid/heart.svg?raw';
import type { RatingsView } from './RatingsView.ts';

const { view }: { view: RatingsView } = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet foot()}
  {#if view.latestTen}Latest 10: <a href={view.latestTen.href}><b>{view.latestTen.text}</b></a>{:else}No 10s yet{/if}
{/snippet}

<ProfileBox label={view.total} tone="ratings" mark={heart} {foot}>
  <div class="bars" role="img" aria-label={view.chartLabel}>
    <span class={['average', { before: view.averageAt > 80 }]} style:--at="{view.averageAt}%" aria-hidden="true"
      ><span>{view.average} avg</span></span>
    {#each view.bars as bar, i (i)}{#if bar.tip}<Tooltip toggles>{#snippet trigger(tooltip)}<i
              class={{ mode: bar.mode }} style:--height="{bar.height}%" {...tooltip}></i>{/snippet}<span class="tip"
            ><span><b>{bar.tip.count}</b> {bar.tip.noun}</span><span class="detail">{bar.tip.share}</span></span
          ></Tooltip>{:else}<i style:--height="0%"></i>{/if}{/each}
  </div>
  <div class="axis" aria-hidden="true">{#each view.bars as _, i (i)}<span>{i + 1}</span>{/each}</div>
</ProfileBox>

<style>
/* A bar's tooltip: its count, the number in bold, over its share in gray. */
.tip {
  display: grid;
}

.detail {
  color: var(--color-tooltip-muted);
}

.bars,
.axis {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 3px;
}

.bars {
  position: relative;
  align-items: end;
  block-size: var(--profile-box-hist-height);
  padding-block-start: var(--profile-box-average-room);

  i {
    block-size: var(--height);
    min-block-size: 2px;
    border-radius: var(--radius-profile-box-mark) var(--radius-profile-box-mark) 0 0;
    background-color: var(--color-profile-mark-dim);

    &.mode {
      background-color: var(--color-profile-mark);
    }
  }
}

.axis {
  margin-block-start: 2px;
  color: var(--color-profile-ink-faint);
  font-size: var(--font-size-profile-axis);
  text-align: center;
}


/* The average: a dotted line across the bars where it falls, its number at the top, before the line near the end. */
.average {
  position: absolute;
  inset-block: 0;
  inset-inline-start: var(--at);
  z-index: 1;
  border-inline-start: 1px dashed var(--color-profile-average);
  pointer-events: none;

  span {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 4px;
    font-family: var(--font-headings);
    font-size: var(--font-size-profile-axis);
    font-weight: var(--font-weight-headings-heavy);
    line-height: 1;
    white-space: nowrap;
  }

  &.before span {
    inset-inline: auto 4px;
  }
}
</style>
