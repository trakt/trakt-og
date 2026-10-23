<!--
  The dashboard greeting's stats: one glass panel on the cover, under the name. All Time leads with the total and its
  plays, then Shows Finished with its meter, then Watched Shows and Watched Movies, each a condensed figure over a line
  of the toolbars' stats (plays first), linked where OG's dashboard band linked them. Each label has a heading's faint
  watermark icon, clipped by its cell. All Time's label and figure open All Time Stats on v3. Four across, two by two in a narrow column.
-->
<script lang="ts">
import HeadingMark from '$lib/components/heading/HeadingMark.svelte';
import Stat from '$lib/components/stats/Stat.svelte';
import type { PanelCount, PanelTime, StatsPanel } from '$lib/dashboard/StatsPanel';
import ban from '$lib/icons/regular/ban.svg?raw';
import barsProgress from '$lib/icons/regular/bars-progress.svg?raw';
import cameraMovie from '$lib/icons/regular/camera-movie.svg?raw';
import play from '$lib/icons/regular/play.svg?raw';
import tvRetro from '$lib/icons/regular/tv-retro.svg?raw';
import clock from '$lib/icons/regular/clock.svg?raw';
import listCheck from '$lib/icons/regular/list-check.svg?raw';
import check from '$lib/icons/trakt/check-thick.svg?raw';
import { traktUrls } from '$lib/traktUrls';

/** `fresh`: nothing watched yet, so each cell names its first milestone in place of its zero counts. */
const { panel, slug, fresh = false }: { panel: StatsPanel; slug: string; fresh?: boolean } = $props();
const user = $derived(`/users/${encodeURIComponent(slug)}`);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet time({ parts, spoken }: PanelTime, href: string)}
  <a class="figure" {href} aria-label="{spoken} watched">
    {#each parts as { value, unit } (unit)}{value}<small>{unit}</small>{/each}
  </a>
{/snippet}

{#snippet stat(svg: string, { text, word }: PanelCount, href: string, tone?: 'watched')}
  <a {href}><Stat {svg} value={text} noun={word} {tone} /></a>
{/snippet}

<div class="stats">
  <div class={["panel", { unfinished: !panel.finished }]} role="group" aria-label="Your Trakt in numbers">
    <div class="cell">
      <p class="label">
        <HeadingMark svg={clock} /><a href={traktUrls.allTimeStats} target="_blank" rel="noopener">All Time</a>
      </p>
      <a class="figure" href={traktUrls.allTimeStats} target="_blank" rel="noopener"
        aria-label="{panel.allTime.spoken} watched, All Time Stats">
        {panel.allTime.value}<small class="word">{panel.allTime.unit}</small>
      </a>
      {#if fresh}<p class="next">Next up: your first hour</p>{:else}
      <p class="counts">{@render stat(play, panel.allTime.plays, `${user}/history`)}</p>{/if}
    </div>
    {#if panel.finished}
      {@const finished = panel.finished}
      <div class="cell">
        <p class="label"><HeadingMark svg={listCheck} /><a href="{user}/progress">Shows Finished</a></p>
        <a class="figure" href="{user}/progress">{finished.finished}<small class="word">of {finished.watched}</small></a>
        {#if finished.meter}
          <div class="meter" role="img"
            aria-label="{finished.finished} finished, {finished.started.text} in progress, {finished.dropped.text} dropped">
            <i style:--share="{finished.meter.finished}%"></i>
            <i style:--share="{finished.meter.started}%"></i>
          </div>
        {/if}
        {#if fresh}<p class="next">Finish a show to start the count</p>{:else}
        <p class="counts">
          {@render stat(barsProgress, finished.started, `${user}/progress`)}
          {@render stat(ban, finished.dropped, `${user}/progress/dropped`)}
        </p>{/if}
      </div>
    {/if}
    <div class="cell">
      <p class="label"><HeadingMark svg={tvRetro} /><a href="{user}/history/episodes">Watched Shows</a></p>
      {@render time(panel.shows.time, `${user}/history/episodes`)}
      {#if fresh}<p class="next">Mark an episode to start the clock</p>{:else}
      <p class="counts">
        {@render stat(play, panel.shows.plays, `${user}/history/episodes`)}
        {@render stat(check, panel.shows.episodes, `${user}/history/episodes`, 'watched')}
        {@render stat(tvRetro, panel.shows.shows, `${user}/history/shows`, 'watched')}
      </p>{/if}
    </div>
    <div class="cell">
      <p class="label"><HeadingMark svg={cameraMovie} /><a href="{user}/history/movies">Watched Movies</a></p>
      {@render time(panel.movies.time, `${user}/history/movies`)}
      {#if fresh}<p class="next">Mark a movie to start the clock</p>{:else}
      <p class="counts">
        {@render stat(play, panel.movies.plays, `${user}/history/movies`)}
        {@render stat(cameraMovie, panel.movies.movies, `${user}/history/movies`, 'watched')}
      </p>{/if}
    </div>
  </div>
</div>

<style>
/* A new member's first milestone, in the welcome wall's gold. */
.next {
  margin: 0;
  color: var(--color-first-night-gold);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-headings);
}

.stats {
  /* On the cover in both themes, so the toolbar stats take their dark colors. */
  color-scheme: dark;
  container-type: inline-size;
  margin-block-start: var(--dashboard-panel-top);
  --color-stat-noun: var(--color-profile-ink-soft);
  --color-heading-mark: var(--color-dashboard-panel-mark);
  --space-heading-mark-inline: var(--dashboard-panel-mark-inline);
  --space-heading-mark-block: var(--dashboard-panel-mark-block);
}

.panel {
  display: grid;
  grid-template-columns: var(--dashboard-panel-columns);
  overflow: hidden;
  border: 1px solid var(--color-profile-pill-border);
  border-radius: var(--radius-dashboard-panel);
  background-color: var(--color-profile-pill-bg);
  backdrop-filter: var(--blur-profile-pill);
  color: var(--color-text-inverse);
  text-shadow: none;

  /* Stats without progress have no Shows Finished. */
  &.unfinished {
    grid-template-columns: var(--dashboard-panel-columns-unfinished);
  }
}

/* Each cell clips its label's watermark, so the icon never spills past the panel or into a neighbour. */
.cell {
  position: relative;
  display: grid;
  align-content: start;
  min-inline-size: 0;
  overflow: hidden;
  padding: var(--dashboard-panel-cell-padding);
  border-inline-start: 1px solid var(--color-dashboard-panel-line);

  &:first-child {
    border-inline-start: 0;
  }
}

/* OG's dashboard stats went red on hover; here the whole link, its numbers and icons, eases to the red. */
a {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-dashboard-panel-hover);

  & :global(.stat),
  & :global(.stat strong),
  & :global(.stat .icon-slot) {
    transition: color var(--transition-dashboard-panel-hover);
  }

  &:is(:hover, :focus-visible) {
    color: var(--color-dashboard-panel-hover);
    text-decoration: none;
    --color-stat-number: var(--color-dashboard-panel-hover);
    --color-stat-noun: var(--color-dashboard-panel-hover);
    --color-stat-count: var(--color-dashboard-panel-hover);
    --color-stat-watched: var(--color-dashboard-panel-hover);

    & small {
      color: inherit;
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-dashboard-panel-hover);
    outline-offset: 2px;
    border-radius: var(--radius-profile-box-mark);
  }
}

.label {
  position: relative;
  isolation: isolate;
  margin: 0;
  color: var(--color-profile-ink-soft);
  font-family: var(--font-headings);
  font-size: var(--font-size-dashboard-panel-label);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-dashboard-panel-label);
  line-height: 1;
  text-transform: uppercase;
}

.figure {
  justify-self: start;
  margin-block: var(--dashboard-panel-figure-gap) var(--dashboard-panel-stats-top);
  font-family: var(--font-dashboard-panel-figures);
  font-size: var(--font-size-dashboard-panel-figure);
  font-weight: var(--font-weight-headings-heavy);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
  /* Trimmed to the digits, so the gaps above and below, and the meter's, measure from the numbers themselves. */
  text-box: trim-both cap alphabetic;

  & small {
    margin-inline: var(--dashboard-panel-unit-gap);
    color: var(--color-profile-ink-soft);
    font-size: var(--font-size-dashboard-panel-unit);
  }

  & small:last-child {
    margin-inline-end: 0;
  }

  & .word {
    margin-inline-start: var(--dashboard-panel-word-gap);
  }
}

/* Finished, then in progress; dropped is the track that's left. It sits in the gap under the figure, close to it, so
   the stats under it line up with every other cell's. */
.figure:has(+ .meter) {
  margin-block-end: 0;
}

.meter {
  display: flex;
  overflow: hidden;
  block-size: var(--dashboard-panel-meter);
  margin-block: var(--dashboard-panel-meter-top)
    calc(var(--dashboard-panel-stats-top) - var(--dashboard-panel-meter-top) - var(--dashboard-panel-meter));
  border-radius: var(--radius-profile-box-mark);
  background-color: var(--color-profile-track);

  & i {
    inline-size: var(--share);
    background-color: var(--color-profile-mark);

    & + i {
      background-color: var(--color-profile-mark-dim);
    }
  }
}

.counts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--dashboard-panel-stats-row-gap) var(--dashboard-panel-stats-gap);
  margin: 0;
  line-height: var(--line-height-dashboard-panel-stats);

  & a {
    display: inline-flex;
    align-items: center;
  }
}

@container (width < 760px) {
  .panel,
  .panel.unfinished {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cell:nth-child(3) {
    border-inline-start: 0;
  }

  .cell:nth-child(n + 3) {
    border-block-start: 1px solid var(--color-dashboard-panel-line);
  }
}
</style>
