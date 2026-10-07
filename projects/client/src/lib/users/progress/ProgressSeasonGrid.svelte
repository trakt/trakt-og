<!--
  An open progress row's seasons, each a block: a heading line with the season's name (linking to its page), its own
  title when it has one, its stats and its percent; then a numbered square an episode. A square is purple once
  watched, the library's teal while it's in your library but not watched, outlined and pulsing for up next, and
  dashed until it airs. Each links to its episode, with a chart tooltip: the screenshot, the code and title, when it
  aired with its runtime and rating, then its status lines. Spoiler settings hide an unwatched episode's screenshot
  and title there, as on the episode cards.
    <ProgressSeasonGrid seasons={row.seasons} type="watched" />
-->
<script lang="ts">
import { page } from '$app/state';
import Stat from '$lib/components/stats/Stat.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import calendar from '$lib/icons/regular/calendar-lines.svg?raw';
import clock from '$lib/icons/regular/clock.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import collection from '$lib/icons/trakt/collection-thick.svg?raw';
import { mediaSpoilers } from '$lib/settings/mediaSpoilers';
import type { ProgressType } from './progressTypes.ts';
import type { EpisodeSquare, ProgressSeason } from './toProgressSeasons.ts';

interface Props {
  seasons: readonly ProgressSeason[];
  type: ProgressType;
}

const { seasons, type }: Props = $props();
const library = $derived(type === 'library');

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
    <li class="season">
      <div class="heading">
        <a class="name" href={season.href}>{season.name}</a>
        {#if season.title}<span class="title">{season.title}</span>{/if}
        <span class="stats">
          {#if season.announced !== undefined}
            <Stat svg={calendar} value={String(season.announced)} noun="announced" />
          {:else}
            <Stat svg={library ? collection : check} tone={library ? 'collected' : 'watched'} value={season.count}
              noun={library ? 'in library' : 'watched'} />
            {#if season.timeLeft}<Stat svg={clock} value={season.timeLeft} noun="left" />{/if}
          {/if}
        </span>
        {#if season.announced === undefined}
          <span class={['percent', { complete: season.complete }]}>{season.percent}%</span>
        {/if}
      </div>
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
  gap: var(--progress-season-gap);
  padding-block-start: var(--progress-season-gap);
  border-block-start: 1px dashed var(--color-separator);
  font-size: var(--font-size-progress-row);
}

.season {
  display: grid;
  gap: var(--progress-season-heading-gap);

  & + & {
    padding-block-start: var(--progress-season-gap);
    border-block-start: 1px solid var(--color-progress-season-rule);
  }
}

.heading {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-stat) var(--space-stats);
}

.name {
  color: var(--color-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-progress-season-name);
  font-weight: var(--font-weight-headings-heavy);
  text-decoration: none;
  white-space: nowrap;

  &:is(:hover, :focus-visible) {
    color: var(--color-progress-watched-text);
    text-decoration: underline;
  }
}

.title {
  margin-inline-start: calc(var(--space-stat) - var(--space-stats));
  color: var(--color-text-muted);
  font-family: var(--font-headings);
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-stat) var(--space-stats);
}

.percent {
  margin-inline-start: auto;
  font: var(--font-weight-headings-heavy) var(--font-size-progress-season-percent) / 1 var(--font-headings);
  font-variant-numeric: tabular-nums;

  &.complete {
    color: var(--color-progress-watched-text);
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
  block-size: var(--progress-square);
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
}
</style>
