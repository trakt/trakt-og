<!--
  The all-time band under the dashboard's cover: time watched, shows finished, ratings, library, comments and followers in
  equal columns, each a label, a figure, a rule and one caption line, with the rules lined up into one across the band.
  Counts from 10,000 up are rounded; the exact value shows on hover and keyboard focus, and screen readers only hear the
  exact one. The library cell waits on the overlay and fills without moving anything.
-->
<script lang="ts">
import Container from '$lib/components/container/Container.svelte';
import Icon from '$lib/icons/Icon.svelte';
import clock from '$lib/icons/thin/clock.svg?raw';
import type { StatFigure, StatsBand } from '$lib/dashboard/toStatsBand';

const { band, slug }: { band: StatsBand; slug: string } = $props();
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
<div class="band" role="group" aria-label="Your Trakt in numbers">
  <Container>
    <ul class="columns">
      <li>
        <p class="kicker"><Icon svg={clock} /><a href="/users/{slug}/history">All time</a></p>
        <div class="line">
          <p class="figure">{@render exact(band.time.value, band.time.exact)}<small aria-hidden="true">{band.time.unit}</small></p>
        </div>
        <div class="rule"></div>
        <p class="caption">
          <b>{@render count(band.plays)}</b> {plural(band.plays, 'play')} ·
          <b>{@render count(band.days)}</b> {plural(band.days, 'day')}
        </p>
      </li>
      {#if band.shows}
        {@const shows = band.shows}
        <li>
          <p class="kicker"><a href="/users/{slug}/progress">Shows finished</a></p>
          <div class="line">
            <p class="figure">{@render count(shows.finished)}<small>of {@render count(shows.watched)}</small></p>
          </div>
          {#if shows.meter}
            <!-- The rule itself: finished, in progress, dropped. -->
            <div class="rule meter" role="img"
              aria-label="{spoken(shows.finished)} finished, {spoken(shows.started)} in progress, {spoken(shows.dropped)} dropped">
              <i style:--share="{shows.meter.finished}%"></i>
              <i style:--share="{shows.meter.started}%"></i>
              <i style:--share="{shows.meter.dropped}%"></i>
            </div>
          {:else}
            <div class="rule"></div>
          {/if}
          <p class="caption">
            <b>{@render count(shows.started)}</b> in progress · <b>{@render count(shows.dropped)}</b> dropped
          </p>
        </li>
      {/if}
      <li>
        <p class="kicker"><a href="/users/{slug}/ratings">Ratings</a></p>
        <div class="line">
          <p class="figure">{@render count(band.ratings.total)}</p>
          {#if band.ratings.average}
            <div class="histogram" role="img" aria-label="Ratings from 1 to 10, averaging {band.ratings.average}.">
              {#each band.ratings.bars as bar (bar.rating)}<i class={{ top: bar.top }} style:--height="{bar.height}%"></i>{/each}
              <u style:--at="{band.ratings.tick}%"></u>
            </div>
          {/if}
        </div>
        <div class="rule"></div>
        {#if band.ratings.average}
          <p class="caption">Average <b>{band.ratings.average}</b></p>
        {:else}
          <p class="caption">No ratings yet</p>
        {/if}
      </li>
      <li>
        <p class="kicker"><a href="/users/{slug}/library">Library</a></p>
        {#if band.library}
          <div class="line">
            <p class="figure">{@render count(band.library.movies)}<small>{plural(band.library.movies, 'movie')}</small></p>
          </div>
          <div class="rule"></div>
          <p class="caption">
            <b>{@render count(band.library.episodes)}</b> {plural(band.library.episodes, 'episode')} ·
            <b>{@render count(band.library.shows)}</b> {plural(band.library.shows, 'show')}
          </p>
        {:else}
          <div class="line">
            <p class="figure" aria-hidden="true"><span class="pending">…</span><small>movies</small></p>
          </div>
          <div class="rule"></div>
          <p class="caption" role="status">Counting…</p>
        {/if}
      </li>
      <li>
        <p class="kicker"><a href="/users/{slug}/comments">{band.comments.lists ? 'Comments & lists' : 'Comments'}</a></p>
        <div class="line">
          <p class="figure">
            {@render count(band.comments.total)}{#if band.comments.lists}<small>· {@render count(band.comments.lists)}
                {plural(band.comments.lists, 'list')}</small>{/if}
          </p>
        </div>
        <div class="rule"></div>
        <p class="caption">
          <b>{@render count(band.comments.movies)}</b> {plural(band.comments.movies, 'movie')} ·
          <b>{@render count(band.comments.shows)}</b> {plural(band.comments.shows, 'show')}
        </p>
      </li>
      <li>
        <p class="kicker"><a href="/users/{slug}/network/followers">Followers</a></p>
        <div class="line"><p class="figure">{@render count(band.followers)}</p></div>
        <div class="rule"></div>
        <p class="caption"><b>{@render count(band.friends)}</b> {plural(band.friends, 'friend')}</p>
      </li>
    </ul>
  </Container>
</div>

<style>
.band {
  container-type: inline-size;
  border-block-end: var(--dashboard-border-width) solid var(--color-dashboard-stats-border);
  background: var(--color-dashboard-stats-bg);
  color: var(--color-text-inverse);
}
/* Equal columns, as many as there are (six, or five without shows finished), on one ruled axis. */
.columns {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
  column-gap: var(--dashboard-band-column-gap);
  row-gap: var(--dashboard-band-row-gap);
  margin: 0;
  padding: var(--dashboard-band-padding-block) 0;
  list-style: none;
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
  block-size: var(--dashboard-band-kicker-height);
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}
/* The figure line: one fixed height, so every rule under it sits at the same top. */
.line {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--dashboard-band-line-gap);
  block-size: var(--dashboard-band-line-height);
  margin-block-start: var(--dashboard-band-line-top);
}
.figure {
  font-family: var(--font-headings);
  font-size: var(--font-size-dashboard-band-figure);
  font-weight: var(--font-weight-profile-figure);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--letter-spacing-dashboard-band-figure);
  line-height: 1;
  white-space: nowrap;
  small {
    margin-inline-start: var(--dashboard-band-unit-gap);
    color: var(--color-profile-ink-soft);
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings);
    letter-spacing: 0;
  }
}
.pending {
  color: var(--color-profile-ink-faint);
}
/* A hairline on top of the meter's height, so a plain rule and the meter push the caption down alike. */
.rule {
  box-sizing: border-box;
  block-size: var(--dashboard-band-rule);
  margin-block-start: var(--dashboard-band-rule-top);
  border-block-start: var(--dashboard-border-width) solid var(--color-profile-track);
}
.meter {
  display: flex;
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-profile-box-mark);
  background: var(--color-profile-track);
  i {
    inline-size: var(--share);
    background: var(--color-profile-mark);
    & + i {
      background: var(--color-profile-mark-dim);
    }
    &:last-child {
      background: var(--color-profile-track);
    }
  }
}
/* Stands on the rule, to the right of the ratings figure. */
.histogram {
  position: relative;
  display: flex;
  flex: 0 1 var(--dashboard-band-histogram-width);
  align-items: end;
  gap: var(--profile-box-bars-gap);
  min-inline-size: var(--dashboard-band-histogram-min-width);
  block-size: var(--dashboard-band-histogram-height);
  margin-block-end: calc(var(--dashboard-band-rule-top) * -1);
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
/* One line, never wrapping. Clipped only across, so an exact value's tooltip still shows above. */
.caption {
  margin-block-start: var(--dashboard-band-caption-top);
  overflow-x: clip;
  color: var(--color-profile-ink-soft);
  font-size: var(--font-size-dashboard-band-caption);
  line-height: var(--line-height-dashboard-band-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
  b {
    color: var(--color-text-inverse);
    font-weight: var(--font-weight-headings-heavy);
  }
}
.exact {
  position: relative;
  cursor: help;
  text-decoration: underline dotted var(--color-profile-ink-faint);
  text-decoration-thickness: var(--dashboard-border-width);
  text-underline-offset: var(--dashboard-band-underline-offset);
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
  /* A caption clips across, so its tooltips grow rightwards from the number instead of centering on it. */
  .caption &::after {
    inset-inline-start: 0;
    translate: none;
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
  .columns {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-flow: row;
  }
}
@container (width < 768px) {
  .columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--dashboard-band-column-gap-phone);
  }
}
@media (prefers-reduced-motion: reduce) {
  .exact::after {
    transition: none;
  }
}
</style>
