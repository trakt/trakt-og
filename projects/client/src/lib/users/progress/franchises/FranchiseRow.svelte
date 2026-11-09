<!--
  One franchise on the progress page, laid out like a show's row (`ProgressRow`): its first released movie's poster, the
  title linking its official list with the years it ran, the tick bar (one tick a released movie, each a hover target
  naming it), the counts as stats, then Movies beside the last watched chip, and a fanart card on the right (once caught up, over the caught up bar, its title shown only when a movie is to come): the up next
  movie with its quick icons, once every released one is watched the next movie not out yet (the bar shows its date in place of the icons), and with nothing to come the latest one, Caught up in the bar. Movies opens every movie as a poster card with its
  quick icons in the same band the show row's seasons open in, across the row, the one up next tagged and any not out yet left out of the bar and the
  counts like an unaired episode. `row` is missing while the franchise's movies load (`onneed` reads them as the row
  nears the screen, and again from Try again if that fails).
-->
<script lang="ts">
import { nearViewport } from '#lib/utils/nearViewport.ts';
import LoadFailed from '#lib/components/empty/LoadFailed.svelte';
import Shimmer from '#lib/components/loading/Shimmer.svelte';
import CaughtUpBar from '#lib/components/media/CaughtUpBar.svelte';
import FanartCard from '#lib/components/media/FanartCard.svelte';
import PosterGrid from '#lib/components/media/PosterGrid.svelte';
import TickBar from '#lib/components/media/TickBar.svelte';
import Stat from '#lib/components/stats/Stat.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import Icon from '#lib/icons/Icon.svelte';
import { overlay } from '#lib/overlay/overlay.ts';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import hourglass from '#lib/icons/regular/hourglass-half.svg?raw';
import history from '#lib/icons/regular/clock-rotate-left.svg?raw';
import play from '#lib/icons/regular/play.svg?raw';
import caretDown from '#lib/icons/solid/caret-down.svg?raw';
import check from '#lib/icons/trakt/check-thick.svg?raw';
import type { Franchise } from './Franchise.ts';
import { franchiseHref } from './franchiseHref.ts';
import type { FranchiseRow } from './FranchiseRow.ts';
import FranchiseMovieCard from './FranchiseMovieCard.svelte';
import { franchiseMovieIcons } from './franchiseMovieIcons.ts';
import ProgressChip from '../ProgressChip.svelte';

interface Props {
  franchise: Franchise;
  row?: FranchiseRow;
  failed?: boolean;
  datePreferences: DatePreferences;
  onneed: () => void;
}

const { franchise, row, failed = false, datePreferences, onneed }: Props = $props();

const PER_ROW = 6;
let open = $state(false);

const count = (n: number) => n.toLocaleString('en-US');
const plural = (n: number, word: string) => `${word}${n === 1 ? '' : 's'}`;
</script>

<!-- Movie and list pages are OG routes og hasn't all built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet sections()}
  {#each row?.movies.filter(({ released }) => released) ?? [] as movie (movie.id)}
    <Tooltip text={movie.year ? `${movie.title} (${movie.year})` : movie.title}>
      {#snippet trigger(tooltip)}
        <span class="section" aria-hidden="true" {...tooltip}></span>
      {/snippet}
    </Tooltip>
  {/each}
{/snippet}

<article class="franchise-row" aria-labelledby="franchise-{franchise.id}" {@attach nearViewport(onneed)}>
  <a class="poster" href={franchiseHref(franchise)} tabindex="-1" aria-hidden="true">
    {#if row?.poster}
      <img src={row.poster} alt="" loading="lazy" decoding="async" />
    {:else}
      <span class="placeholder"></span>
    {/if}
  </a>

  <div class="main-info">
    <div class="franchise-title">
      <h3 class="title" id="franchise-{franchise.id}"><a class="titles-link" href={franchiseHref(franchise)}>{franchise.name}</a></h3>
      {#if row?.years}<span class="year">{row.years}</span>{/if}
    </div>

    {#if row}
      <TickBar runs={row.ticks} percent={row.percent} label={`${row.title}: ${row.percent}% watched`}
        overlay={row.released > 0 ? sections : undefined} />

      <p class="stats">
        <Stat svg={check} tone="watched" value="{count(row.watched)} / {count(row.released)}" noun="watched"
          label="Movies watched" />
        <Stat svg={play} value={count(row.plays)} noun={plural(row.plays, 'play')} label="Plays"
          under="Rewatches included" />
        <Stat svg={history} value={row.watchedTime} noun="watched" label="Time watched" />
        {#if row.left > 0}
          <Stat svg={hourglass} value={row.leftTime} noun="left" label="Left to watch"
            aside="({count(row.left)} {plural(row.left, 'movie')})" />
        {/if}
      </p>

      <div class="actions">
        <button type="button" class="toggle" aria-expanded={open} aria-controls="franchise-movies-{franchise.id}"
          onclick={() => (open = !open)}>Movies<Icon svg={caretDown} /></button>
        {#if row.last}
          <ProgressChip href={row.last.href}><Icon svg={history} />Last watched <b>{row.last.title}</b>
            {row.last.relative ?? row.last.date}</ProgressChip>
        {/if}
      </div>
    {:else if failed}
      <LoadFailed what={franchise.name} onretry={onneed} />
    {:else}
      <div class="bar" aria-hidden="true">
        <Shimmer inline="100%" block="var(--progress-bar-height)" />
        <Shimmer inline="var(--progress-shimmer-percent-width)" block="var(--font-size-tick-bar-percent)" />
      </div>
      <p class="stats" aria-hidden="true">
        {#each Array.from({ length: 3 }, (_, i) => i) as stat (stat)}
          <Shimmer inline="var(--progress-shimmer-stat-width)" block="var(--font-size-stat-number)" />
        {/each}
      </p>
    {/if}
  </div>

  <div class="card">
    {#if row?.feature}
      {@const { movie, kind, tag, next } = row.feature}
      {#snippet caughtUp()}<CaughtUpBar {next} {datePreferences} />{/snippet}
      <FanartCard framed href={movie.href} title={movie.title} year={movie.year} image={movie.fanart} tags={tag ? [tag] : []}
        hideTitle={kind === 'caught-up'}
        icons={kind === 'up-next'
          ? franchiseMovieIcons({ movie, state: overlay.state('movie', movie.id), datePreferences })
          : undefined}
        bar={kind === 'up-next' ? undefined : caughtUp} />
    {/if}
  </div>

  <div class="movies" id="franchise-movies-{franchise.id}" hidden={!open}>
    {#if open && row}
      <div class="band">
        <PosterGrid columns={PER_ROW}>
          {#each row.movies as movie (movie.id)}
            <FranchiseMovieCard {movie} upNext={row.feature?.kind === 'up-next' && movie.id === row.feature.movie.id}
              {datePreferences} />
          {/each}
        </PosterGrid>
      </div>
    {/if}
  </div>
</article>

<style>
.franchise-row {
  display: grid;
  grid-template-columns: var(--progress-poster-width) minmax(0, 1fr) var(--progress-card-width);
  align-items: start;
  column-gap: var(--progress-row-gap);
  padding: var(--progress-row-padding);
  border-block-start: 1px solid var(--color-separator);

  &:first-of-type {
    border-block-start: 0;
  }
}

.main-info {
  --tick-bar-height: var(--progress-bar-height);
  --tick-bar-margin: 0;
  --line-height-tick-bar-percent: 1;

  display: grid;
  align-content: start;
  gap: var(--progress-main-gap);
  min-inline-size: 0;
  font-size: var(--font-size-progress-row);

  & :global(.tick-bar) {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  & :global(.track) {
    border-radius: var(--radius-progress-bar);
  }
}

.franchise-title {
  display: flex;
  align-items: baseline;
  gap: var(--progress-title-gap);
  min-inline-size: 0;
}

.title {
  min-inline-size: 0;
  margin: 0;
  font-family: var(--font-headings);
  font-size: var(--font-size-progress-title);
  font-weight: var(--font-weight-headings-heavy);
  line-height: var(--line-height-headings);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  & a {
    color: var(--color-text);
    text-decoration: none;

    &:is(:hover, :focus-visible) {
      text-decoration: underline;
    }
  }
}

.year {
  flex: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-progress-year);
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-stat) var(--space-stats);
  margin: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--progress-title-gap);
  min-inline-size: 0;
  margin-block-start: calc(var(--progress-last-gap) - var(--progress-main-gap));
}

.bar {
  display: flex;
  align-items: center;
  gap: var(--tick-bar-percent-gap);

  & > :global(:first-child) {
    flex: 1;
  }
}

.poster {
  display: block;

  & :is(img, .placeholder) {
    display: block;
    inline-size: 100%;
    aspect-ratio: var(--ratio-poster);
    border-radius: var(--radius-object);
    object-fit: cover;
  }

  & .placeholder {
    background-color: var(--color-card-bg);
    background-image: var(--image-placeholder-poster);
    background-size: cover;
  }
}

/* Movies: first on the line, its caret flipping once open. */
.toggle {
  box-sizing: border-box;
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--progress-inline-gap);
  block-size: var(--progress-action-height);
  padding: var(--progress-action-padding);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background: var(--color-control-bg);
  color: var(--color-control-text);
  font: var(--font-size-progress-row) / var(--line-height-progress-row) var(--font-body);
  cursor: pointer;

  &:is(:hover, :focus-visible, [aria-expanded='true']) {
    border-color: var(--color-control-border-hover);
    background: var(--color-control-hover-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
  }

  & :global(.icon) {
    flex: none;
    font-size: var(--font-size-progress-toggle-icon);
    transition: rotate 0.2s;
  }

  &[aria-expanded='true'] :global(.icon) {
    rotate: 180deg;
  }
}

.card {
  /* The card's icon bar matched the dark row, so it's lifted off it here. */
  --color-card-bg: var(--color-progress-card-bg);

  min-inline-size: 0;
}

/* Every movie in the season list's band, across the whole row under the poster and the card. */
.movies {
  grid-column: 1 / -1;
  min-inline-size: 0;
  margin-block-start: var(--progress-strip-gap);
}

.band {
  display: grid;
  padding: var(--progress-band-padding);
  /* The grid's gutter on the sides, and on top from the grid's own, so the posters sit as far from the band's edge
     as from each other. */
  padding-block-start: 0;
  padding-inline: var(--gutter);
  border-radius: var(--radius-progress-band);
  background: var(--color-progress-band);

  & :global(.poster-grid-frame) {
    margin-block-end: 0;
  }
}

/* A movie's stretch of the bar: on hover the others dim and a notch splits it from its neighbour. */
.section {
  position: relative;
  flex: 1 1 0;
  min-inline-size: 0;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    transition: background-color 0.15s;
  }
}

:global(.overlay:has(.section:hover)) .section {
  & + .section {
    box-shadow: inset var(--progress-section-notch) 0 0 var(--color-surface);
  }

  &:not(:hover)::after {
    background: var(--color-progress-section-dim);
  }
}

@media (width < 1200px) {
  .franchise-row {
    grid-template-columns: var(--progress-poster-width-tablet) minmax(0, 1fr) var(--progress-card-width-tablet);
  }
}

/* OG hid the poster below desktop. */
@media (width < 992px) {
  .franchise-row {
    grid-template-columns: minmax(0, 1fr) var(--progress-card-width-tablet);
  }

  .poster {
    display: none;
  }

  /* The stats keep their icons and leave their words to the tooltips and screen readers, so they fit one line. */
  .stats :global(.noun) {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}

@media (width < 768px) {
  .franchise-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toggle :global(.icon),
  .section::after {
    transition: none;
  }
}
</style>
