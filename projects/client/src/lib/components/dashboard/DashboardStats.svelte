<!--
  The greeting's all-time band: time watched as the headline, then shows finished, ratings, library, comments and
  followers. Counts from 10,000 up are rounded; the exact value shows on hover and keyboard focus, and screen readers
  only hear the exact one. The library cell waits on the overlay and fills without moving anything.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import Icon from '$lib/icons/Icon.svelte';
import clock from '$lib/icons/thin/clock.svg?raw';
import type { StatFigure, StatsBand } from '$lib/dashboard/toStatsBand';

const { band, slug, covered = false }: { band: StatsBand; slug: string; covered?: boolean } = $props();
const plural = (figure: StatFigure, word: string) => (figure.text === '1' ? word : `${word}s`);
const spoken = (figure: StatFigure) => figure.exact ?? figure.text;
</script>

{#snippet exact(text: string, value: string)}
  <!-- A focus stop, so the exact value shows from the keyboard too. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <span class="exact" tabindex="0"
  data-exact={value}><span aria-hidden="true">{text}</span><span class="sr">{value}</span></span>
{/snippet}

{#snippet count(figure: StatFigure)}
  {#if figure.exact}{@render exact(figure.text, figure.exact)}{:else}{figure.text}{/if}
{/snippet}

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class={['band', { covered }]} role="group" aria-label="Your Trakt in numbers">
  <Container>
    <div class="grid">
      <div>
        <p class="kicker"><Icon svg={clock} /><a href="/users/{slug}/history">All time</a></p>
        <p class="hero">
          <b>{@render exact(band.time.value, band.time.exact)}</b>
          <span><span aria-hidden="true">{band.time.unit}</span> watched</span>
        </p>
        <ul class="chips">
          <li><b>{@render count(band.plays)}</b> {plural(band.plays, 'play')}</li>
          <li><b>{@render count(band.days)}</b> {plural(band.days, 'day')}</li>
        </ul>
      </div>
      <ul class="cells">
        {#if band.shows}
        {@const shows = band.shows}
        <li>
          <p class="kicker"><a href="/users/{slug}/progress">Shows finished</a></p>
          <p class="figure">{@render count(shows.finished)}<small>of {@render count(shows.watched)}</small></p>
          {#if shows.meter}
            <div class="meter" role="img"
              aria-label="{spoken(shows.finished)} finished, {spoken(shows.started)} in progress, {spoken(shows.dropped)} dropped">
              <i style:--share="{shows.meter.finished}%"></i>
              <i style:--share="{shows.meter.started}%"></i>
              <i style:--share="{shows.meter.dropped}%"></i>
            </div>
            <p class="caption">
              <b>{@render count(shows.started)}</b> in progress · <b>{@render count(shows.dropped)}</b> dropped
            </p>
          {/if}
        </li>
        {/if}
        <li>
          <p class="kicker"><a href="/users/{slug}/ratings">Ratings</a></p>
          <p class="figure">{@render count(band.ratings.total)}</p>
          {#if band.ratings.average}
            <div class="histogram" role="img" aria-label="Ratings from 1 to 10, averaging {band.ratings.average}.">
              {#each band.ratings.bars as bar (bar.rating)}<i class={{ top: bar.top }} style:--height="{bar.height}%"></i>{/each}
              <u style:--at="{band.ratings.tick}%"></u>
            </div>
            <p class="caption">Average <b>{band.ratings.average}</b></p>
          {:else}
            <p class="caption">No ratings yet</p>
          {/if}
        </li>
        <li>
          <p class="kicker"><a href="/users/{slug}/library">Library</a></p>
          {#if band.library}
            <p class="figure">{@render count(band.library.movies)}<small>{plural(band.library.movies, 'movie')}</small></p>
            <p class="caption">
              <b>{@render count(band.library.episodes)}</b> {plural(band.library.episodes, 'episode')} ·
              <b>{@render count(band.library.shows)}</b> {plural(band.library.shows, 'show')}
            </p>
          {:else}
            <p class="figure" aria-hidden="true"><span class="pending">…</span><small>movies</small></p>
            <p class="caption" role="status">Counting…</p>
          {/if}
        </li>
        <li>
          <p class="kicker"><a href="/users/{slug}/comments">Comments</a></p>
          <p class="figure">{@render count(band.comments.total)}</p>
          <p class="caption">
            <b>{@render count(band.comments.movies)}</b> {plural(band.comments.movies, 'movie')} ·
            <b>{@render count(band.comments.shows)}</b> {plural(band.comments.shows, 'show')}
            {#if band.comments.lists}<br /><b>{@render count(band.comments.lists)}</b> {plural(band.comments.lists, 'list')}{/if}
          </p>
        </li>
        <li>
          <p class="kicker"><a href="/users/{slug}/network/followers">Followers</a></p>
          <p class="figure">{@render count(band.followers)}</p>
          <p class="caption"><b>{@render count(band.friends)}</b> {plural(band.friends, 'friend')}</p>
        </li>
      </ul>
    </div>
  </Container>
</div>

<style>
.band {
  container-type: inline-size;
  background: var(--color-dashboard-stats-bg);
  color: var(--color-text-inverse);
  &.covered {
    background: var(--color-profile-tabs-bg);
  }
}
.grid {
  display: grid;
  grid-template-columns: var(--dashboard-band-lead) minmax(0, 1fr);
  gap: var(--dashboard-band-gap);
  align-items: center;
  padding-block: var(--dashboard-band-padding-block);
}
p {
  margin: 0;
}
a {
  color: inherit;
  &:is(:hover, :focus-visible) {
    text-decoration: underline;
  }
}
.kicker {
  display: flex;
  align-items: center;
  gap: var(--dashboard-band-kicker-gap);
  color: var(--color-profile-ink-soft);
  font-family: var(--font-headings);
  font-size: var(--font-size-dashboard-band-kicker);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-dashboard-band-kicker);
  line-height: 1;
  text-transform: uppercase;
}
.hero {
  display: flex;
  align-items: baseline;
  gap: var(--dashboard-band-hero-gap);
  margin-block-start: var(--dashboard-band-hero-top);
  b {
    font-family: var(--font-headings);
    font-size: var(--font-size-profile-figure);
    font-weight: var(--font-weight-profile-figure);
    font-variant-numeric: tabular-nums;
    letter-spacing: var(--letter-spacing-profile-figure);
    line-height: 1;
  }
  > span {
    color: var(--color-profile-ink-soft);
    font-family: var(--font-headings);
    font-size: var(--font-size-profile-figure-label);
    font-weight: var(--font-weight-headings);
  }
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--dashboard-band-chip-gap);
  margin: var(--dashboard-band-chips-top) 0 0;
  padding: 0;
  list-style: none;
  li {
    padding: var(--profile-chip-padding);
    border-radius: var(--radius-profile-chip);
    background: var(--color-dashboard-band-chip);
    font-family: var(--font-headings);
    font-size: var(--font-size-profile-chip);
    font-weight: var(--font-weight-headings);
    line-height: 1;
    white-space: nowrap;
  }
  b {
    font-weight: var(--font-weight-profile-figure);
  }
}
.cells {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
  > li {
    min-inline-size: 0;
    padding: var(--dashboard-band-cell-padding);
    border-inline-start: var(--dashboard-border-width) solid var(--color-profile-track);
    &:first-child {
      padding-inline-start: 0;
      border-inline-start: 0;
    }
  }
  .kicker {
    font-size: var(--font-size-dashboard-band-cell-kicker);
  }
}
.figure {
  margin-block-start: var(--dashboard-band-figure-top);
  font-family: var(--font-headings);
  font-size: var(--font-size-dashboard-band-figure);
  font-weight: var(--font-weight-profile-figure);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--letter-spacing-dashboard-band-figure);
  line-height: 1;
  small {
    margin-inline-start: var(--dashboard-band-unit-gap);
    color: var(--color-profile-ink-soft);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings);
    letter-spacing: 0;
  }
}
.caption {
  margin-block-start: var(--dashboard-band-caption-top);
  color: var(--color-profile-ink-soft);
  font-size: var(--font-size-dashboard-band-caption);
  line-height: var(--line-height-dashboard-band-caption);
  b {
    color: var(--color-text-inverse);
    font-weight: var(--font-weight-headings-heavy);
  }
}
.pending {
  color: var(--color-profile-ink-faint);
}
.meter {
  display: flex;
  gap: var(--profile-box-bars-gap);
  block-size: var(--dashboard-band-meter-height);
  margin-block-start: var(--dashboard-band-mark-top);
  i {
    inline-size: var(--share);
    border-radius: var(--radius-profile-box-mark);
    background: var(--color-profile-mark);
    & + i {
      background: var(--color-profile-mark-dim);
    }
    &:last-child {
      background: var(--color-profile-track);
    }
  }
}
.histogram {
  position: relative;
  display: flex;
  align-items: end;
  gap: var(--profile-box-bars-gap);
  block-size: var(--dashboard-band-histogram-height);
  margin-block-start: var(--dashboard-band-mark-top);
  i {
    flex: 1;
    block-size: var(--height);
    min-block-size: var(--profile-box-bars-gap);
    border-radius: var(--radius-profile-box-mark) var(--radius-profile-box-mark) 0 0;
    background: var(--color-profile-mark-dim);
    &.top {
      background: var(--color-profile-mark);
    }
  }
  u {
    position: absolute;
    inset-block: calc(var(--profile-box-bars-gap) * -1);
    inset-inline-start: var(--at);
    inline-size: var(--dashboard-band-tick);
    margin-inline-start: calc(var(--dashboard-band-tick) / -2);
    border-radius: var(--radius-dashboard-band-tick);
    background: var(--color-profile-genre-tick);
    box-shadow: var(--shadow-profile-genre-tick);
  }
}
.exact {
  position: relative;
  cursor: help;
  text-decoration: underline dotted var(--color-profile-ink-faint);
  text-decoration-thickness: var(--dashboard-border-width);
  text-underline-offset: var(--dashboard-band-underline-offset);
  .hero & {
    text-decoration: none;
  }
  &::after {
    content: attr(data-exact);
    position: absolute;
    inset-block-end: calc(100% + var(--tooltip-arrow));
    inset-inline-start: 50%;
    z-index: 1;
    padding: var(--space-tooltip);
    border-radius: var(--radius-tooltip);
    background: var(--color-tooltip-bg);
    color: var(--color-tooltip-text);
    font-family: var(--font-headings);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings);
    letter-spacing: 0;
    line-height: var(--line-height-tooltip);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    translate: -50% 0;
    transition: opacity var(--transition-tooltip);
  }
  &:is(:hover, :focus-visible)::after {
    opacity: 1;
  }
}
.sr {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@container (width < 1200px) {
  .grid {
    grid-template-columns: var(--dashboard-band-lead-narrow) minmax(0, 1fr);
  }
  .cells {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: var(--dashboard-band-row-gap);
    > li {
      padding: var(--dashboard-band-cell-padding-narrow);
      &:nth-child(3n + 1) {
        padding-inline-start: 0;
        border-inline-start: 0;
      }
    }
  }
}
@container (width < 768px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--dashboard-band-row-gap);
  }
  .hero b {
    font-size: var(--font-size-dashboard-band-hero-phone);
  }
  .cells {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    > li {
      padding: var(--dashboard-band-cell-padding-phone);
      border-inline-start: var(--dashboard-border-width) solid var(--color-profile-track);
      &:nth-child(odd) {
        padding-inline-start: 0;
        border-inline-start: 0;
      }
      &:last-child {
        grid-column: 1 / -1;
      }
    }
  }
}
@media (prefers-reduced-motion: reduce) {
  .exact::after {
    transition: none;
  }
}
</style>
