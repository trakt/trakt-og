<!--
  An open progress row's seasons: each season's name (linking to its page) with what's watched and left (the row's own
  `Stat`s, a size down), then its tick bar and percent, like the show's (exact episodes, or one fill with Simple
  Progress Bars). A season's toggle, or the row's View all (`expanded`),
  shows its episodes under it, a numbered pill each. A pill is purple once watched, the library's teal while it's in
  your library but not watched, outlined and pulsing for up next, and dashed until it airs. Each links to its episode,
  with a chart tooltip: the screenshot, the code and title, when it aired with its runtime and rating, then its status
  lines. Spoiler settings hide an unwatched episode's screenshot and title there, as on the episode cards.
    <ProgressSeasonGrid seasons={row.seasons} id={row.id} {expanded} ontoggle={toggleSeason} {simple} />
-->
<script lang="ts">
import { page } from '$app/state';
import TickBar from '$lib/components/media/TickBar.svelte';
import Stat from '$lib/components/stats/Stat.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import calendar from '$lib/icons/regular/calendar-lines.svg?raw';
import clock from '$lib/icons/regular/clock.svg?raw';
import caretDown from '$lib/icons/solid/caret-down.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import { mediaSpoilers } from '$lib/settings/mediaSpoilers';
import type { EpisodeSquare, ProgressSeason } from './toProgressSeasons.ts';

interface Props {
  seasons: readonly ProgressSeason[];
  /** The show's id, for the episode lists' ids. */
  id: number;
  /** Whether a season shows its episodes. */
  expanded: (season: number) => boolean;
  ontoggle: (season: number) => void;
  /** The Simple Progress Bars setting, as on the show's bar. */
  simple: boolean;
}

const { seasons, id, expanded, ontoggle, simple }: Props = $props();

const spoilers = (square: EpisodeSquare) =>
  page.data.user
    ? mediaSpoilers({
      spoilers: page.data.settings?.browsing?.spoilers,
      type: 'episode',
      watched: square.state === 'watched',
    })
    : { screenshot: false, title: false };
</script>

{#snippet tip(square: EpisodeSquare)}
  {@const hidden = spoilers(square)}
  <span class="tip">
    {#if square.image && !hidden.screenshot}<img class="tip-image" src={square.image} alt="" loading="lazy" />{/if}
    <span class="tip-code">{square.code}</span>
    {#if square.title && !hidden.title}<span class="tip-title">{square.title}</span>{/if}
    {#if square.meta}<span class="tip-meta">{square.meta}</span>{/if}
    {#each square.lines as line (line.text)}
      <span class="tip-line" style:--dash="var(--color-progress-tip-{line.tone})">{line.text}</span>
    {/each}
  </span>
{/snippet}

<!-- Season and episode pages are OG routes og hasn't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<ul class="seasons">
  {#each seasons as season (season.number)}
    {@const open = expanded(season.number)}
    {@const list = `progress-${id}-season-${season.number}`}
    <li class="season">
      <p class="head">
        <button type="button" class="fold" aria-expanded={open} aria-controls={list}
          aria-label="{open ? 'Hide' : 'Show'} {season.name} episodes" onclick={() => ontoggle(season.number)}>
          <Icon svg={caretDown} />
        </button>
        <a class="name" href={season.href}>{season.name}</a>
        {#if season.title}<span class="season-title">{season.title}</span>{/if}
        <span class="stats">
          {#if season.announced === undefined}
            <Stat svg={check} tone="watched" value={season.count} noun="watched" />
            {#if season.timeLeft}<Stat svg={clock} value={season.timeLeft} noun="left" />{/if}
          {:else}
            <Stat svg={calendar} value={String(season.announced)} noun="announced" />
          {/if}
        </span>
      </p>
      {#if season.announced === undefined}
        <div class={['bar', { complete: season.complete }]}>
          <TickBar runs={season.ticks} percent={season.percent} {simple} size="season"
            label="{season.name}: {season.percent}% watched" />
        </div>
      {/if}
      <div class="episodes" id={list} hidden={!open}>
        {#if open}
      <ul class="squares" aria-label="{season.name} episodes">
        {#each season.squares as square (square.code)}
          <li>
            <Tooltip variant="chart">
              {#snippet trigger(tooltip)}
                <a class={['square', square.state, { collected: square.collected }]} href={square.href}
                  aria-label={square.label} {...tooltip}>{square.number}</a>
              {/snippet}
              {@render tip(square)}
            </Tooltip>
          </li>
        {/each}
      </ul>
        {/if}
      </div>
    </li>
  {/each}
</ul>

<style>
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.seasons {
  display: grid;
  padding: var(--progress-band-padding);
  border-radius: var(--radius-progress-band);
  background: var(--color-progress-band);
  font-size: var(--font-size-progress-row);
}

/* A header line (name, stats, bar, percent), then the pills across the full width. The percent's column is fixed,
   so every season's bar ends at the same point and the percents line up. */
/* The name and stats, then the bar and its percent, then the episodes once shown. */
.season {
  display: grid;
  grid-template-areas: 'head' 'bar' 'episodes';
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  column-gap: var(--progress-season-columns);
  padding-block: var(--progress-season-padding);

  & + & {
    border-block-start: 1px solid var(--color-progress-season-rule);
  }
}

.head {
  grid-area: head;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--progress-season-stats-gap) var(--progress-season-title-gap);
  min-inline-size: 0;
  margin: 0 0 var(--progress-season-head-gap);
  line-height: var(--line-height-progress-season-name);

  & .season-title {
    color: var(--color-text-muted);
    font-size: var(--font-size-small);
  }
}

/* A season's episodes toggle: a caret that turns down once they show. */
.fold {
  display: grid;
  place-items: center;
  inline-size: var(--progress-season-fold);
  block-size: var(--progress-season-fold);
  min-block-size: 0;
  padding: 0;
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background: var(--color-control-bg);
  color: var(--color-control-text);
  cursor: pointer;

  & :global(.icon) {
    font-size: var(--font-size-progress-toggle-icon);
    rotate: -90deg;
    transition: rotate 0.2s;
  }

  &[aria-expanded='true'] :global(.icon) {
    rotate: 0deg;
  }

  &:is(:hover, :focus-visible) {
    border-color: var(--color-control-border-hover);
    background: var(--color-control-hover-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
  }
}

.name {
  color: var(--color-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-progress-season-name);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    color: var(--color-progress-watched-text);
    text-decoration: underline;
  }
}

/* What's watched and left, as the row's own stats a size down, after the name. */
.stats {
  --font-size-stat-icon: var(--font-size-progress-season-stat-icon);
  --font-size-stat-number: var(--font-size-progress-season-stat-number);
  --font-size-stat-noun: var(--font-size-progress-season-stat-noun);

  display: flex;
  flex-wrap: wrap;
  gap: var(--progress-season-stats-gap) var(--progress-season-stat-gap);
  margin-inline-start: var(--progress-season-stats-offset);
  font-variant-numeric: tabular-nums;
}

.episodes {
  grid-area: episodes;
  margin-block-start: var(--progress-season-episodes-gap);
}

/* The season's tick bar: its percent in a fixed column, so every bar ends at the same point and the percents line up,
   and purple once the season is done. */
.bar {
  --tick-bar-height-season: var(--progress-season-bar-height);
  --font-size-tick-bar-percent-season: var(--font-size-progress-season-percent);
  --tick-bar-percent-season-nudge: 0;

  grid-area: bar;
  min-inline-size: 0;

  & :global(.tick-bar) {
    grid-template-columns: minmax(0, 1fr) var(--progress-season-percent);
    align-items: center;
    column-gap: var(--progress-season-columns);
  }

  & :global(.track) {
    border-radius: var(--radius-progress-season-bar);
  }

  & :global(.percent) {
    font-weight: var(--font-weight-headings-heavy);
    font-variant-numeric: tabular-nums;
  }

  &.complete :global(.percent) {
    color: var(--color-progress-percent-done);
  }
}

.squares {
  display: flex;
  flex-wrap: wrap;
  gap: var(--progress-square-gap);
}

.square {
  display: grid;
  place-items: center;
  inline-size: var(--progress-square);
  block-size: var(--progress-square-height);
  border-radius: var(--radius-progress-square);
  background: var(--color-progress-square);
  color: var(--color-text-muted);
  font: var(--font-weight-headings-heavy) var(--font-size-progress-square) / 1 var(--font-headings);
  font-variant-numeric: tabular-nums;
  text-decoration: none;

  &:is(:hover, :focus-visible) {
    outline: var(--progress-square-ring) solid var(--color-text);
    outline-offset: 1px;
  }

  &.watched {
    background: var(--color-progress-watched);
    color: var(--color-text-inverse);
  }

  &.collected {
    background: var(--color-progress-collected);
    color: var(--color-text-inverse);
  }

  &.up-next {
    box-shadow: inset 0 0 0 var(--progress-square-ring) var(--brand-primary);
    color: var(--brand-primary);
    animation: pulse var(--progress-cell-pulse-duration) ease-out infinite;

    &:not(.collected) {
      background: none;
    }

    &.collected {
      color: var(--color-text-inverse);
    }
  }

  &.not-aired {
    background: none;
    box-shadow: inset 0 0 0 1px var(--color-progress-square-announced);
  }
}

@keyframes pulse {
  0% {
    box-shadow: inset 0 0 0 var(--progress-square-ring) var(--brand-primary), 0 0 0 0 var(--color-progress-cell-pulse);
  }

  70%,
  100% {
    box-shadow:
      inset 0 0 0 var(--progress-square-ring) var(--brand-primary),
      0 0 0 var(--progress-cell-pulse) transparent;
  }
}

/* The chart tooltip's body, like the dashboard's minutes chart. */
.tip {
  display: grid;
  inline-size: var(--progress-tip-width);
  text-align: start;
}

.tip-image {
  inline-size: 100%;
  aspect-ratio: var(--ratio-fanart);
  margin-block-end: var(--progress-tip-image-gap);
  border-radius: var(--radius-progress-tip-image);
  object-fit: cover;
}

.tip-code {
  color: var(--color-chart-tooltip-muted);
  font-size: var(--font-size-genre-count);
}

.tip-title {
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-headings);
}

.tip-meta {
  color: var(--color-chart-tooltip-muted);
  font-family: var(--font-body);
  font-size: var(--font-size-genre-key-count);
  font-weight: normal;
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
    flex: none;
    inline-size: var(--genre-tip-dash);
    block-size: var(--genre-tip-dash-height);
    background: var(--dash);
  }
}

@media (prefers-reduced-motion: reduce) {
  .square.up-next {
    animation: none;
  }

  .fold :global(.icon) {
    transition: none;
  }
}
</style>
