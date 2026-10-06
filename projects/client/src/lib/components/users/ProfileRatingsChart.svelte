<!--
  The profile's ratings chart, in the Last 30 Days chart's style: ratings 1 to 10 as rounded bars in their rating
  colors, each with its count over it, over dashed count lines labelled in a gutter and a dashed line at the average.
  Under the axis each rating has its name, the most given one picked out. Hovering or focusing a bar dims the others
  and shows the rating, its count and its share of all ratings; clicking it opens the ratings page at that rating.
  Each bar is a link named by its rating and count, so it works with the keyboard and a screen reader. A rating
  with none gets a faint 0 over a dot and a hidden label.
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import { countLabel } from '$lib/utils/countLabel';
import type { ProfileRatingBar, ProfileRatings } from '$lib/users/profile/toProfileRatings';

const { chart, slug }: { chart: NonNullable<ProfileRatings['chart']>; slug: string } = $props();

const name = (bar: ProfileRatingBar) => `${bar.rating} — ${bar.name}: ${countLabel(bar.count, 'rating')}`;
</script>

<!-- The ratings page isn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="ratings-chart">
  <div class="plot">
    {#each chart.levels as level (level.label)}
      <span class="level" style:--at="{level.height}%" aria-hidden="true"><span class="level-label">{level.label}</span></span>
    {/each}
    <!-- Decoration: the Average key says it too. -->
    <span class={['average', { before: chart.average.labelBefore }]} style:--at="{chart.average.at}%" aria-hidden="true">
      <span class="average-label">{chart.average.label}</span>
    </span>

    <ol class="bars" aria-label="Ratings distribution">
      {#each chart.bars as bar (bar.rating)}
        <li class="column" style:--color="var(--rating-{bar.rating})">
          {#if bar.count > 0}
            <Tooltip variant="chart">
              {#snippet trigger(tooltip)}
                <a class="bar-link" href="/users/{slug}/ratings/all/{bar.rating}" aria-label={name(bar)} {...tooltip}>
                  <span class="count" aria-hidden="true">{bar.count.toLocaleString('en-US')}</span>
                  <span class="bar" style:--fraction={bar.height / 100}></span>
                </a>
              {/snippet}
              <span class="tip">
                <span class="tip-title">{bar.rating} · {bar.name}</span>
                <span class="tip-count">{bar.count.toLocaleString('en-US')}<span class="tip-unit"
                  >{bar.count === 1 ? 'rating' : 'ratings'}</span></span>
                <span class="tip-line">{bar.share} of all ratings</span>
              </span>
            </Tooltip>
          {:else}
            <span class="count zero" aria-hidden="true">0</span>
            <span class="stub" aria-hidden="true"></span>
            <span class="hidden-label">{name(bar)}</span>
          {/if}
        </li>
      {/each}
    </ol>
  </div>

  <!-- Each bar's name already carries its rating's. -->
  <div class="axis" aria-hidden="true">
    {#each chart.bars as bar (bar.rating)}
      <span class={['axis-label', { top: bar.top }]}>
        <span class="number">{bar.rating}</span>
        <span class="name">{bar.name}</span>
      </span>
    {/each}
  </div>
</div>

<style>
.ratings-chart {
  padding-block-start: var(--space-ratings-chart);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  /* The tooltip sits over the bar's count, as close as the Last 30 Days chart's. */
  --chart-tooltip-offset: var(--minutes-tooltip-offset);
}

.plot {
  position: relative;
  block-size: var(--ratings-plot-height);
  margin-inline-start: var(--ratings-gutter);
  border-block-end: 1px solid var(--color-chart-axis);
}

/* A count line across the plot at a height, labelled in the gutter. */
.level {
  position: absolute;
  inset-block-end: var(--at);
  inset-inline: calc(-1 * var(--ratings-gutter)) 0;
  border-block-start: 1px dashed var(--color-minutes-grid);
  pointer-events: none;
}

.level-label {
  position: absolute;
  inset-inline-start: 0;
  transform: translateY(-50%);
  color: var(--color-chart-axis-label);
  font-size: var(--font-size-minutes-label);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

/* The average, up from the axis at its place along the ratings, labelled at its top. */
.average {
  position: absolute;
  z-index: 1;
  inset-block: calc(-1 * var(--ratings-average-rise)) 0;
  inset-inline-start: var(--at);
  border-inline-start: 1px dashed var(--color-minutes-average);
  pointer-events: none;
}

.average-label {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: var(--space-ratings-average-label);
  translate: 0 -50%;
  padding: var(--space-minutes-average-label);
  background-color: var(--color-charts-bg);
  color: var(--color-minutes-mark);
  font-size: var(--font-size-minutes-label);
  line-height: 1;
  white-space: nowrap;

  /* Near the right edge, it reads back from the line. */
  .before & {
    inset-inline: auto var(--space-ratings-average-label);
  }
}

.bars {
  display: flex;
  block-size: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.column {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: end;
  min-inline-size: 0;
}

.bar-link {
  position: absolute;
  inset-block-end: 0;
  inset-inline: var(--ratings-bar-gap);
  display: flex;
  flex-direction: column;
  text-decoration: none;
  transition: opacity var(--transition-chart);

  /* The rest dim while one bar is picked out, like the Last 30 Days chart. */
  .bars:has(.bar-link:is(:hover, :focus-visible)) &:not(:hover, :focus-visible) {
    opacity: var(--opacity-genre-piece-dimmed);
  }
}

.count {
  display: block;
  margin-block-end: var(--space-ratings-count);
  color: var(--color-ratings-count);
  font-size: var(--font-size-genre-count);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: center;

  &.zero {
    color: var(--color-ratings-zero);
  }
}

.bar {
  /* A single rating still shows a sliver. */
  block-size: max(1px, calc(var(--ratings-plot-height) * var(--fraction)));
  border-start-start-radius: var(--radius-minutes-bar);
  border-start-end-radius: var(--radius-minutes-bar);
  background-color: var(--color);
}

.stub {
  inline-size: var(--minutes-stub);
  block-size: var(--minutes-stub);
  margin-block-end: var(--minutes-stub);
  border-radius: 50%;
  background-color: var(--color-minutes-stub);
}

.tip,
.tip-title,
.tip-count {
  display: block;
}

.tip {
  text-align: start;
}

.tip-title {
  color: var(--color-chart-tooltip-muted);
  font-size: var(--font-size-genre-count);
  text-transform: uppercase;
}

.tip-count {
  font-size: var(--font-size-genre-share);
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-genre-share);
}

.tip-unit {
  margin-inline-start: var(--space-ratings-tip-unit);
  color: var(--color-chart-tooltip-muted);
  font-size: var(--font-size-genre-key-count);
  font-weight: var(--font-weight-headings);
}

.tip-line {
  display: flex;
  align-items: center;
  gap: var(--space-genre-key-top);
  font-family: var(--font-body);
  font-size: var(--font-size-genre-key-count);
  font-weight: normal;

  &::before {
    content: '';
    inline-size: var(--genre-tip-dash);
    block-size: var(--genre-tip-dash-height);
    background: var(--color);
  }
}

.axis {
  display: flex;
  margin-inline-start: var(--ratings-gutter);
  padding-block-start: var(--space-ratings-axis);
  line-height: var(--line-height-ratings-axis);
  text-align: center;
}

.axis-label {
  flex: 1;
  min-inline-size: 0;
}

.number,
.name {
  display: block;
}

.number {
  color: var(--color-ratings-number);
  font-size: var(--font-size-genre-label);
}

/* Narrow, the longer names trail off. */
.name {
  overflow: hidden;
  color: var(--color-ratings-name);
  font-size: var(--font-size-genre-count);
  font-weight: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top :is(.number, .name) {
  color: var(--color-ratings-top);
}

.top .number {
  font-weight: var(--font-weight-headings-heavy);
}

.hidden-label {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .bar-link {
    transition: none;
  }
}
</style>
