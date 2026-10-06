<!--
  The votes chart on a movie, show or episode's summary (yirChart, a Chart.js bar chart): votes 1 to 10 as gray bars
  on a ticked axis, the most voted one picked out. Hovering or focusing a bar shows "43 votes" and "8 — Great" above
  it. og draws it with HTML: each bar is a button named by its rating and votes, so it works with the keyboard and a
  screen reader (OG's canvas had no text alternative). The profile's ratings chart is `ProfileRatingsChart`.
-->
<script lang="ts">
import type { RatingBar } from '$lib/users/profile/toRatingsChart';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { countLabel } from '$lib/utils/countLabel';

const { bars }: { bars: readonly RatingBar[] } = $props();
</script>

<div class="ratings-chart">
  <ol class="plot" aria-label="Votes by rating">
    {#each bars as bar (bar.rating)}
      <li class="column" style:--height="{bar.height}%" style:--fraction={bar.height / 100}>
        <Tooltip variant="chart">
          {#snippet trigger(tooltip)}
            <button class="bar-link" type="button" aria-label="{bar.label}: {countLabel(bar.count, 'vote')}" {...tooltip}>
              <span class={['bar', { top: bar.top }]}></span>
            </button>
          {/snippet}
          <span class="stat">{countLabel(bar.count, 'vote')}</span>
          <span class="rating">{bar.label}</span>
        </Tooltip>
        <span class="axis-label" aria-hidden="true">{bar.rating}</span>
      </li>
    {/each}
  </ol>
</div>

<style>
.ratings-chart {
  block-size: var(--media-ratings-chart-height);
  padding: var(--media-ratings-plot-inset);
}

.plot {
  position: relative;
  display: flex;
  box-sizing: content-box;
  block-size: var(--media-ratings-plot-height);
  margin: 0;
  padding: 0;
  border-block-end: 1px solid var(--color-chart-axis);
  border-inline-start: 1px solid var(--color-chart-axis);
  list-style: none;

  /* The y axis's five steps, ticked on its outside. */
  &::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: calc(-1 * var(--chart-tick) - 1px);
    inline-size: var(--chart-tick);
    background: repeating-linear-gradient(to bottom, var(--color-chart-axis) 0 1px, transparent 1px 20%);
  }
}

.column {
  position: relative;
  flex: 1;

  /* A tick under the axis between bars, and at both ends. */
  &::before,
  &:last-child::after {
    content: '';
    position: absolute;
    inset-block-start: calc(100% + 1px);
    inset-inline-start: -1px;
    inline-size: 1px;
    block-size: var(--chart-tick);
    background-color: var(--color-chart-axis);
  }

  &:last-child::after {
    inset-inline: auto 0;
  }
}

.bar-link {
  position: absolute;
  inset-block-end: 0;
  display: flex;
  align-items: end;
  /* A short bar still gets something to hover. */
  block-size: max(var(--height), var(--media-ratings-hit-height));
  inline-size: 100%;
  min-block-size: 0;
  padding: 0 var(--ratings-bar-spacing);
  border: 0;
  background: none;
  cursor: help;
}

.bar {
  inline-size: 100%;
  block-size: calc(var(--media-ratings-plot-height) * var(--fraction));
  background-color: var(--color-ratings-bar);

  &.top {
    background-color: var(--color-ratings-bar-top);
  }

  .bar-link:is(:hover, :focus-visible) & {
    background-color: var(--color-ratings-bar-hover);
  }
}

.stat,
.rating {
  display: block;
}

.stat {
  font-size: var(--font-size-chart-tooltip);
}

.rating {
  color: var(--color-chart-tooltip-muted);
  font-size: var(--font-size-chart-tooltip-small);
}

.axis-label {
  position: absolute;
  inset-block-start: calc(100% + var(--chart-tick) + var(--chart-axis-label-gap));
  inset-inline: 0;
  color: var(--color-chart-axis-label);
  font-family: var(--font-chart);
  font-size: var(--font-size-chart-axis);
  line-height: 1;
  text-align: center;
}
</style>
