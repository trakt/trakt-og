<!--
  The Last 30 Days minutes chart: one bar a day, episodes stacked under movies in the genre tooltip's colors, over
  dashed hour lines and a dashed line for the average watching day. Brackets over the bars group the days into the
  viewer's weeks, each with its total, the best one picked out. Hovering or focusing a bar dims the others, like the
  genre band, and shows the day, the time watched and a line per type; clicking it opens that day's history. Each
  bar is a link named by its day, time and plays, so it works with the keyboard and a screen reader. A day with
  nothing watched gets a dot and a hidden label.
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import type { MinutesChartData, MinutesDay } from '$lib/dashboard/LastThirtyDays';

const { chart }: { chart: MinutesChartData } = $props();

const name = (day: MinutesDay) =>
  [`${day.label}: ${day.time} watched`, ...day.lines.map(({ text }) => text)].join(', ');
</script>

<!-- The history page is a route, but resolve() can't take its query string. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<div class="minutes-chart">
  <!-- Decoration: each bar's name already carries its day's time. -->
  <div class="weeks" aria-hidden="true">
    {#each chart.weeks as week, i (i)}
      <span class={['week', { best: week.best }]} style:flex-grow={week.span}>{week.time}</span>
    {/each}
  </div>

  <div class="plot">
    {#each chart.hours as hour (hour.label)}
      <span class="level" style:--at="{hour.height}%" aria-hidden="true"><span class="hour">{hour.label}</span></span>
    {/each}
    <span class="level average" style:--at="{chart.average.height}%">
      <span class="average-label">{chart.average.label}</span>
    </span>

    <ol class="days" aria-label="Time watched each day">
      {#each chart.days as day (day.date)}
        <li class={['column', { today: day.mark === 'today', marked: day.mark === 'month' || day.mark === 'today' }]}>
          {#if day.minutes > 0}
            <Tooltip variant="chart">
              {#snippet trigger(tooltip)}
                <a
                  class="bar-link"
                  href={day.href}
                  aria-label={name(day)}
                  style:--height="{day.episodes + day.movies}%"
                  {...tooltip}
                >
                  {#if day.episodes > 0}<span class="part episode" style:--part={day.episodes / 100}></span>{/if}
                  {#if day.movies > 0}<span class="part movie" style:--part={day.movies / 100}></span>{/if}
                </a>
              {/snippet}
              <span class="tip">
                <span class="tip-title">{day.label}</span>
                <span class="tip-time">{day.time}</span>
                {#each day.lines as line (line.type)}
                  <span class="tip-line" style:--dash="var(--color-minutes-{line.type})">{line.text}</span>
                {/each}
              </span>
            </Tooltip>
          {:else}
            <span class="stub" aria-hidden="true"></span>
            <span class="hidden-label">{day.label}: nothing watched</span>
          {/if}
          <span class={['axis-label', day.mark]} aria-hidden="true">{day.axis}</span>
        </li>
      {/each}
    </ol>
  </div>
</div>

<style>
.minutes-chart {
  container-type: inline-size;
  padding-block-end: calc(var(--space-minutes-axis) + var(--font-size-minutes-label));
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
  /* OG's tooltip sat closer to its bar than the ratings chart's. */
  --chart-tooltip-offset: var(--minutes-tooltip-offset);
}

.weeks {
  display: flex;
  margin-block-end: var(--space-minutes-weeks);
  margin-inline-start: var(--minutes-gutter);
}

.week {
  position: relative;
  flex-basis: 0;
  min-inline-size: 0;
  overflow: hidden;
  padding: 0 var(--minutes-bracket-inset) var(--space-minutes-week-label);
  color: var(--color-minutes-week);
  font-size: var(--font-size-minutes-week);
  line-height: 1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* The bracket: a line over the week's bars with a short tick down at each end. */
  &::after {
    content: '';
    position: absolute;
    inset-block-end: 0;
    inset-inline: var(--minutes-bracket-inset);
    block-size: var(--minutes-bracket);
    border: 1px solid var(--color-minutes-bracket);
    border-block-end: 0;
  }

  &.best {
    color: var(--color-minutes-week-best);

    &::after {
      border-color: var(--color-minutes-bracket-best);
    }
  }
}

.plot {
  position: relative;
  block-size: var(--minutes-plot-height);
  margin-inline-start: var(--minutes-gutter);
  border-block-end: 1px solid var(--color-chart-axis);
}

/* A line across the plot at a height: the hour lines, labelled in the gutter, and the average. */
.level {
  position: absolute;
  inset-block-end: var(--at);
  inset-inline: calc(-1 * var(--minutes-gutter)) 0;
  border-block-start: 1px dashed var(--color-minutes-grid);
  pointer-events: none;
}

.hour {
  position: absolute;
  inset-inline-start: 0;
  transform: translateY(-50%);
  color: var(--color-chart-axis-label);
  font-size: var(--font-size-minutes-label);
  line-height: 1;
}

.average {
  z-index: 1;
  inset-inline-start: 0;
  border-color: var(--color-minutes-average);
}

.average-label {
  position: absolute;
  inset-block-end: var(--minutes-average-lift);
  inset-inline-end: 0;
  padding: var(--space-minutes-average-label);
  background-color: var(--color-surface);
  color: var(--color-minutes-mark);
  font-size: var(--font-size-minutes-label);
  line-height: 1;
  white-space: nowrap;
}

.days {
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
  align-items: end;
  justify-content: center;
  min-inline-size: 0;

  /* Today's column, outlined from the top of the plot. */
  &.today::after {
    content: '';
    position: absolute;
    inset: 0 calc(var(--minutes-bar-gap) - 1px);
    border: 1px dashed var(--color-minutes-today);
    border-block-end: 0;
    border-start-start-radius: var(--radius-minutes-bar);
    border-start-end-radius: var(--radius-minutes-bar);
    pointer-events: none;
  }
}

.bar-link {
  position: absolute;
  inset-block-end: 0;
  inset-inline: var(--minutes-bar-gap);
  display: flex;
  flex-direction: column-reverse;
  /* A short day still gets something to hover. */
  block-size: max(var(--height), var(--minutes-bar-hit-height));
  transition: opacity var(--transition-chart);

  /* The rest dim while one bar is picked out, like the genre band. */
  .days:has(.bar-link:is(:hover, :focus-visible)) &:not(:hover, :focus-visible) {
    opacity: var(--opacity-genre-piece-dimmed);
  }
}

.part {
  flex: none;
  block-size: calc(var(--minutes-plot-height) * var(--part));
  background-color: var(--color);

  &:last-child {
    border-start-start-radius: var(--radius-minutes-bar);
    border-start-end-radius: var(--radius-minutes-bar);
  }

  &.episode {
    --color: var(--color-minutes-episode);
  }

  &.movie {
    --color: var(--color-minutes-movie);
  }
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
.tip-time {
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

.tip-time {
  font-size: var(--font-size-genre-share);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-genre-share);
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
    background: var(--dash);
  }
}

.axis-label {
  position: absolute;
  inset-block-start: calc(100% + var(--space-minutes-axis));
  inset-inline: 0;
  color: var(--color-chart-axis-label);
  font-size: var(--font-size-minutes-label);
  font-weight: normal;
  line-height: 1;
  text-align: center;
  white-space: nowrap;

  &.weekend {
    color: var(--color-minutes-weekend);
  }

  &:is(.month, .today) {
    color: var(--color-minutes-mark);
    font-weight: var(--font-weight-headings);
  }
}

/* Too narrow for 30 labels: every other day keeps its number, and the month names and Today stay. */
@container (inline-size < 600px) {
  .column:nth-child(even):not(.marked) .axis-label {
    visibility: hidden;
  }
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
