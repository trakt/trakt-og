<!--
  One `CountryRanking` row: the country's flag and name, its share rolling to each new count, and a bar of its share
  against the top country's, red for shows and gray for movies. A country with only a few people gets a plain gray bar.
  `move` shows an arrow for a few seconds when the row climbs or falls; `round` restarts it on each refresh.
-->
<script lang="ts">
import Icon from '#lib/icons/Icon.svelte';
import caret from '#lib/icons/solid/caret-down.svg?raw';
import { untrack } from 'svelte';
import { cubicOut } from 'svelte/easing';
import { prefersReducedMotion, Tween } from 'svelte/motion';
import type { HomeLiveCountry } from '#lib/home/live/toHomeLive.ts';
import { sharePercent } from './sharePercent.ts';

interface Props {
  country: HomeLiveCountry;
  /** Shown before the name on the live page, which lists every country. */
  rank?: number;
  /** The top country's share, which fills the bar. */
  most: number;
  digits: number;
  move?: number;
  round: number;
  flag?: string;
}

const { country, rank, most, digits, move, round, flag }: Props = $props();
const ROLL_MS = 1400;

const share = new Tween(untrack(() => country.share), { duration: 0 });
let counted = false;
$effect(() => {
  const next = country.share;
  const roll = counted && !prefersReducedMotion.current ? { duration: ROLL_MS, easing: cubicOut } : { duration: 0 };
  counted = true;
  void share.set(next, roll);
});

const shows = $derived(country.watching?.shows ?? 1);
</script>

{#if rank !== undefined}<span class="rank">{rank}</span>{/if}
<span class="name">
  {#if flag}<img class="flag" src={flag} alt="" />{/if}{country.name}
  {#if country.watching}
    {@const { top } = country.watching}
    <!-- What the map's card shows, which is drawn for the pointer only. -->
    <span class="said">
      , {Math.round(shows * 100)}% shows, most watched {top.type === 'shows' ? 'show' : 'movie'} {top.title}
    </span>
  {/if}
</span>
<span class="number">
  {#key round}
    {#if move}
      <span class={['move', { up: move > 0 }]}>
        <Icon svg={caret} label={move > 0 ? "Up" : "Down"} />{Math.abs(move)}
      </span>
    {/if}
  {/key}
  {sharePercent(share.current, digits)}
</span>
<span class={['bar', { quiet: !country.watching }]} aria-hidden="true">
  <span class="shows" style:--part={(country.share * shows) / most}></span>
  <span class="movies" style:--part={(country.share * (1 - shows)) / most} style:--after={(country.share * shows) / most}
  ></span>
</span>

<style>
.rank {
  grid-row: 1;
  inline-size: var(--home-rank-number-width);
  font-family: var(--font-box-office-figures);
  font-size: var(--font-size-home-rank-name);
  font-stretch: condensed;
  font-variant-numeric: tabular-nums;
  text-align: end;
  color: var(--color-home-muted);
}

.name {
  display: inline-flex;
  gap: var(--space-sm-inline);
  align-items: center;
  min-inline-size: 0;
  font-size: var(--font-size-home-rank-name);
  font-weight: var(--font-weight-headings);
}

.said {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.flag {
  flex: none;
  inline-size: var(--home-flag-size);
  block-size: var(--home-flag-size);
}

.number {
  display: inline-flex;
  gap: var(--space-xs-inline);
  align-items: baseline;
  font-family: var(--font-box-office-figures);
  font-size: var(--font-size-home-rank-count);
  font-stretch: condensed;
  font-variant-numeric: tabular-nums;
}

.move {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-headings);
  font-size: var(--font-size-home-rank-move);
  font-weight: var(--font-weight-headings);
  color: var(--color-home-muted);
  animation: shown calc(var(--home-rank-move-shown-ms) * 1ms) ease-out forwards;

  &.up {
    color: var(--brand-primary);

    & :global(svg) {
      rotate: 180deg;
    }
  }
}

@keyframes shown {
  0%,
  70% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

/* Each part scales from the left edge, so a new count slides it without laying the row out again. */
.bar {
  position: relative;
  grid-column: 1 / -1;
  block-size: var(--home-rank-bar-height);

  & span {
    position: absolute;
    inset: 0;
    border-radius: var(--radius-tag);
    transform-origin: left;
    transform: translateX(calc(var(--after, 0) * 100%)) scaleX(var(--part));
    transition: transform calc(var(--home-rank-move-ms) * 1ms) cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  & .movies {
    margin-inline-start: var(--home-rank-bar-gap);
  }

  &.quiet span {
    background: var(--color-home-map-dot);
  }
}

.shows {
  background: var(--brand-primary);
}

.movies {
  background: var(--color-home-movies);
}

@media (prefers-reduced-motion: reduce) {
  .bar span {
    transition: none;
  }
}
</style>
