<!--
  The band under the hero: the `WorldMap` of where people are watching the trending titles right now, and beside it
  the ten countries with the most, sharing one lit country, at one decimal.
-->
<script lang="ts">
import PanelHeading from '#lib/components/dashboard/PanelHeading.svelte';
import PanelHelp from '#lib/components/dashboard/PanelHelp.svelte';
import CountryRanking from '#lib/components/worldmap/CountryRanking.svelte';
import WorldMap from '#lib/components/worldmap/WorldMap.svelte';
import globe from '#lib/icons/solid/globe.svg?raw';
import type { HomeLive } from './live/toHomeLive.ts';

interface Props {
  live: HomeLive | null;
}

const { live }: Props = $props();
const RANKED = 10;
/** Shares keep a place after the point, as on the live page. */
const DIGITS = 1;
const count = (n: number) => n.toLocaleString('en-US');

let lit = $state<string | null>(null);
const countries = $derived(live?.countries ?? null);
const ranks = $derived(!live || live.countries.some(({ watching }) => watching));
</script>

<section class="band" aria-labelledby="home-map-title" aria-busy={!live}>
  <div class="inner">
    <div class="world">
      <PanelHeading id="home-map-title" title="Trakt Worldwide" icon={globe} />
      <PanelHelp>
        {#if live}
          Watching right now in {count(live.countries.length)} countries.
        {:else}
          Watching right now…
        {/if}
      </PanelHelp>
      <div class="map">
        <WorldMap {countries} bind:lit digits={DIGITS} label="World map of where people are watching right now" />
      </div>
    </div>

    {#if ranks}
      <div class="side">
        <CountryRanking {countries} limit={RANKED} bind:lit digits={DIGITS} />
      </div>
    {/if}
  </div>
</section>

<style>
.band {
  container-type: inline-size;
  padding-block: var(--home-band-padding-block);
  padding-inline: max(var(--home-gutter), calc((100% - var(--home-content-width)) / 2));
  border-block: 1px solid var(--color-home-line);
  background: var(--color-home-band);
  color: var(--color-home-text);
}

.inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--home-band-side);
  gap: var(--home-band-gap);
  align-items: start;
}

@container (width < 900px) {
  .inner {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* The map's west edge is open ocean and a few small islands, so it reaches into the band's left margin, as far as the
   margin allows, to draw the rest wider and taller. */
.map {
  --reach: clamp(0px, (100vw - var(--home-content-width)) / 2 - var(--home-map-bleed-edge), var(--home-map-bleed));
  /* The key stays under the heading. */
  --world-map-foot-inset: var(--reach);
  margin-block-start: var(--home-map-top);
  margin-inline-start: calc(-1 * var(--reach));
}

.side {
  align-self: center;
}
</style>
