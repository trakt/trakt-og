<!--
  The countries with the most people watching right now, each with its flag, share and a bar of shows against movies.
  Hovering a row lights its country on the `WorldMap` that shares `lit`. When the counts change, rows slide to their new
  places, shares roll and an arrow says how far a row moved. Each row tells screen readers what the map's card shows. `limit` keeps the top few (the home page); without it the
  live page lists every country with its rank, the ones with only a few people last under their own line. Until the
  count arrives, shimmering rows hold the countries' places.
    <CountryRanking countries={live?.countries ?? null} limit={8} bind:lit />
-->
<script lang="ts">
import Shimmer from '#lib/components/loading/Shimmer.svelte';
import type { HomeLiveCountry } from '#lib/home/live/toHomeLive.ts';
import { untrack } from 'svelte';
import { flip } from 'svelte/animate';
import { prefersReducedMotion } from 'svelte/motion';
import CountryRankRow from './CountryRankRow.svelte';
import { countryFlag } from './countryFlag.ts';
import { rankMoves } from './rankMoves.ts';

interface Props {
  /** Most watchers first; null until the count arrives. */
  countries: readonly HomeLiveCountry[] | null;
  limit?: number;
  lit?: string | null;
  digits?: number;
}

let { countries, limit, lit = $bindable(null), digits = 0 }: Props = $props();
/** Shimmering rows while the count loads, when there's no `limit` to match. */
const LOADING_ROWS = 8;
const MOVE_MS = 900;

// Countries with only a few people leave out what they watch; the top few stop before them.
const ranked = $derived((countries ?? []).filter(({ watching }) => watching).slice(0, limit));
const quiet = $derived(limit === undefined ? (countries ?? []).filter(({ watching }) => !watching) : []);
const most = $derived(ranked.at(0)?.share ?? 1);
const numbered = $derived(limit === undefined);

let moves = $state.raw<ReadonlyMap<string, number>>(new Map());
let round = $state(0);
let before: readonly string[] | null = null;
$effect(() => {
  const codes = ranked.map(({ code }) => code);
  untrack(() => {
    if (before) {
      moves = rankMoves(before, codes);
      round += 1;
    }
    before = codes;
  });
});

const slide = () => ({ duration: prefersReducedMotion.current ? 0 : MOVE_MS });
</script>

{#if countries}
  <ol class={['rank', { numbered }]} aria-label="Countries with the most people watching">
    {#each ranked as country, i (country.code)}
      <li
        class={{ lit: lit === country.code }}
        animate:flip={slide()}
        onpointerenter={() => (lit = country.code)}
        onpointerleave={() => (lit = null)}
      >
        <CountryRankRow
          {country}
          rank={numbered ? i + 1 : undefined}
          {most}
          {digits}
          move={moves.get(country.code)}
          {round}
          flag={countryFlag(country.code)}
        />
      </li>
    {/each}
  </ol>
  {#if quiet.length > 0}
    <p class="quiet">Just a few people in each</p>
    <ol class="rank numbered" aria-label="Countries with only a few people watching" start={ranked.length + 1}>
      {#each quiet as country, i (country.code)}
        <li
          class={{ lit: lit === country.code }}
          animate:flip={slide()}
            onpointerenter={() => (lit = country.code)}
          onpointerleave={() => (lit = null)}
        >
          <CountryRankRow {country} rank={ranked.length + i + 1} {most} {digits} {round} flag={countryFlag(country.code)} />
        </li>
      {/each}
    </ol>
  {/if}
{:else}
  <ol class="rank" aria-hidden="true">
    {#each Array.from({ length: limit ?? LOADING_ROWS }, (_, row) => row) as row (row)}
      <li>
        <span class="name">
          <Shimmer inline="var(--home-flag-size)" block="var(--home-flag-size)" round />
          <Shimmer
            inline="var({row % 2 ? '--home-rank-shimmer-name-short-width' : '--home-rank-shimmer-name-width'})"
            block="var(--font-size-home-rank-name)"
          />
        </span>
        <span class="number">
          <Shimmer inline="var(--home-rank-shimmer-count-width)" block="var(--font-size-home-rank-count)" />
        </span>
        <span class="bar"><Shimmer inline="100%" block="var(--home-rank-bar-height)" /></span>
      </li>
    {/each}
  </ol>
{/if}

<style>
.rank {
  display: grid;
  gap: var(--home-rank-gap);
  margin: 0;
  padding: 0;
  list-style: none;

  & li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-xs-inline) var(--space-sm-inline);
    align-items: center;
    padding: var(--home-rank-padding);
    border-radius: var(--radius-object);

    &.lit {
      background: var(--color-home-rank-hover);
    }
  }

  /* Rank, name and share on one line, the bar under the name and share. */
  &.numbered li {
    grid-template-columns: auto minmax(0, 1fr) auto;

    & :global(.bar) {
      grid-column: 2 / -1;
    }
  }
}

.quiet {
  margin: var(--space-md-block) 0 var(--space-xs-block);
  padding-inline: var(--home-rank-padding);
  font-size: var(--font-size-small);
  color: var(--color-home-muted);
}

.name {
  display: inline-flex;
  gap: var(--space-sm-inline);
  align-items: center;
}

.bar {
  grid-column: 1 / -1;
}
</style>
