<!--
  Watch Time: All Time and Last 30 Days tabs in place of its label, then the picked period's bars (plays a week, month,
  quarter or year since joining, or time watched a day for 30 days) with the busiest in full white, its time watched
  as a big figure, and its counts in the foot band: shows, episodes and movies all time, or episodes, movies and active days in the
  last 30 days. Every count is an icon and a number, its name in a tooltip.
-->
<script lang="ts">
import Stat from '#lib/components/stats/Stat.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import BoxFigure from '#lib/components/users/profile-box/BoxFigure.svelte';
import ProfileBox from '#lib/components/users/profile-box/ProfileBox.svelte';
import calendar from '#lib/icons/regular/calendar-days.svg?raw';
import { mediaTypeIconShift, mediaTypeIcons } from '#lib/icons/mediaTypeIcons.ts';
import stopwatch from '#lib/icons/solid/stopwatch.svg?raw';
import type { WatchChart, WatchTimeView } from './WatchTimeView.ts';

const { view }: { view: WatchTimeView } = $props();

const periods = [
  { id: 'all', label: 'All Time' },
  { id: 'month', label: 'Last 30 Days' },
] as const;
// svelte-ignore state_referenced_locally
let period = $state<(typeof periods)[number]['id']>(view.opens);

/** A number with its word for screen readers, and the stat's name for its tooltip. */
const count = (value: number, word: string, label: string) =>
  ({ value: value.toLocaleString('en-US'), noun: value === 1 ? word : `${word}s`, label, bare: true }) as const;
</script>

{#snippet allTime()}
  <p class="stats">
    <Stat svg={mediaTypeIcons.show} {...count(view.allTime.shows, 'show', 'Shows')}
      iconShift={mediaTypeIconShift('show')} />
    <Stat svg={mediaTypeIcons.episode} {...count(view.allTime.episodes, 'episode', 'Episodes')} />
    <Stat svg={mediaTypeIcons.movie} {...count(view.allTime.movies, 'movie', 'Movies')} />
  </p>
{/snippet}

{#snippet month()}
  <p class="stats">
    {#if view.month.episodes > 0}<Stat svg={mediaTypeIcons.episode} {...count(view.month.episodes, 'episode', 'Episodes')} />{/if}
    {#if view.month.movies > 0}<Stat svg={mediaTypeIcons.movie} {...count(view.month.movies, 'movie', 'Movies')} />{/if}
    <Stat svg={calendar} {...count(view.month.activeDays, 'active day', 'Active days')} />
  </p>
{/snippet}

{#snippet tabs()}
  <div class="tabs" role="group" aria-label="Stats period">
    {#each periods as { id, label } (id)}
      <button type="button" aria-pressed={period === id} onclick={() => (period = id)}>{label}</button>
    {/each}
  </div>
{/snippet}

{#snippet bars(chart: WatchChart)}
  <div class="bars" role="img" aria-label={chart.label}>
    {#each chart.bars as bar, i (i)}
      <Tooltip toggles>
        {#snippet trigger(tooltip)}
          <i class={['bar', { peak: bar.peak, zero: bar.height === 0 }]} style:--height="{bar.height}%" {...tooltip}></i>
        {/snippet}
        <span class="tip"><b>{bar.title}</b><span class="detail">{bar.plays} (<em>{bar.time}</em>)</span></span>
      </Tooltip>
    {/each}
  </div>
{/snippet}

<div class="watch">
{#snippet figure()}
  <div class="figure">
    <BoxFigure value={period === 'all' ? view.allTime.time : view.month.hours} label="watched" />
  </div>
{/snippet}

<ProfileBox tone="stats" mark={stopwatch} aside={tabs} top={figure} foot={period === 'all' ? allTime : month}>
  {@const chart = period === 'all' ? view.allTime.chart : view.month.chart}
  {#if chart}{@render bars(chart)}{/if}
</ProfileBox>
</div>

<style>
.stats {
  --font-size-stat-number: var(--font-size-profile-box-stat);
  --font-size-stat-icon: var(--font-size-profile-box-stat);
  display: flex;
  gap: var(--profile-box-stats-gap);
  margin: 0;
}

.figure {
  --profile-box-figure-gap: var(--profile-box-tab-figure-gap);
}

/* The bars, the busiest in full white and empty spans as a faint track. */
.bars {
  display: flex;
  align-items: flex-end;
  gap: var(--profile-box-bars-gap);
  block-size: var(--profile-box-bars-height);
  margin-block-start: var(--profile-box-bars-below);

  .bar {
    flex: 1;
    block-size: var(--height);
    min-block-size: var(--profile-box-bar-min);
    border-radius: var(--radius-profile-box-mark) var(--radius-profile-box-mark) 0 0;
    background-color: var(--color-profile-mark-dim);

    &.peak {
      background-color: var(--color-profile-mark);
    }

    &.zero {
      background-color: var(--color-profile-track);
    }
  }
}

/* A bar's tooltip: its day or span in bold over its plays and time in gray, the time in italics. */
.tip {
  display: grid;
}

.detail {
  color: var(--color-tooltip-muted);
}

/* Blue icons, as on every other stat, over a darker band so they show on the blue. */
.watch {
  --color-profile-box-band: var(--color-profile-stats-band);
}

.stats {
  --color-stat-count: var(--color-profile-stats-icon);
}

/* The two periods in the label's tracked caps, the picked one white. */
.tabs {
  display: flex;
  gap: var(--profile-box-tab-gap);
}

/* No control height: the tabs sit where the other boxes' labels do. */
button {
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-profile-box-tab-idle);
  font-family: var(--font-headings);
  font-size: var(--font-size-profile-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-profile-label);
  line-height: 1.2;
  text-transform: uppercase;
  cursor: pointer;

  &[aria-pressed='true'] {
    color: var(--color-card-text);
  }

  &:hover {
    color: var(--color-card-text);
  }
}
</style>
