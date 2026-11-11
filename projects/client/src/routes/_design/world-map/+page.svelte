<script lang="ts">
import LinkButton from '#lib/components/button/LinkButton.svelte';
import CountryRanking from '#lib/components/worldmap/CountryRanking.svelte';
import WorldMap from '#lib/components/worldmap/WorldMap.svelte';
import worldDotsFine from '#lib/components/worldmap/worldDotsFine.json' with { type: 'json' };
import DemoButton from '#lib/design/DemoButton.svelte';
import Specimen from '#lib/design/Specimen.svelte';
import Variant from '#lib/design/Variant.svelte';
import type { HomeLiveCountry } from '#lib/home/live/toHomeLive.ts';

// Sample weights, not real counts: roughly where Trakt's members watch from.
const WEIGHTS: Readonly<Record<string, number>> = {
  US: 30, GB: 8.5, DE: 6, BR: 5.2, CA: 4.8, FR: 4, NL: 3.2, ES: 3, IT: 2.8, AU: 2.7, PL: 2.2, MX: 1.9, SE: 1.6,
  BE: 1.4, TR: 1.3, AR: 1.2, IN: 1.2, PT: 1.1, DK: 1, NO: 1, FI: 0.9, CH: 0.9, AT: 0.8, IE: 0.8, NZ: 0.6, ZA: 0.5,
  JP: 0.3, IS: 0.1, EE: 0.08, MT: 0.05,
};
const TITLES = [
  { type: 'shows', title: 'Severance', year: 2022, href: '/shows/severance' },
  { type: 'movies', title: 'Sinners', year: 2025, href: '/movies/sinners-2025' },
] as const;
/** Under this share a sample country has only a few people, so it leaves out what they watch. */
const QUIET = 0.0015;
const names = new Intl.DisplayNames(['en'], { type: 'region' });

function toCountries(weights: Readonly<Record<string, number>>): HomeLiveCountry[] {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  return Object.entries(weights)
    .map(([code, weight], i) => ({
      code,
      name: names.of(code) ?? code,
      share: weight / total,
      ...(weight / total >= QUIET && { watching: { shows: 0.55 + (i % 5) * 0.06, top: TITLES[i % 2] ?? TITLES[0] } }),
    }))
    .toSorted((a, b) => b.share - a.share);
}

let weights = $state(WEIGHTS);
const countries = $derived(toCountries(weights));
let night = $state(false);
let homeLit = $state<string | null>(null);
let liveLit = $state<string | null>(null);

// A random walk, like a minute of real changes: most countries drift, a few jump places.
function newCounts() {
  weights = Object.fromEntries(
    Object.entries(weights).map(([code, weight]) => [code, weight * Math.exp((Math.random() - 0.5) * 0.5)]),
  );
}
</script>

<Specimen title="Home page" bleed
  note="The band under the hero, with the top ten at one decimal. Hover a country or a row to light both. New counts fades the shades, pings the countries that grew, slides the rows and rolls the shares.">
  <div class="controls"><DemoButton onclick={newCounts}>New counts</DemoButton></div>
  <section class="band">
    <div class="home">
      <WorldMap {countries} bind:lit={homeLit} digits={1} label="Sample world map" />
      <CountryRanking {countries} limit={10} bind:lit={homeLit} digits={1} />
    </div>
  </section>
</Specimen>

<Specimen title="Live page" bleed
  note="Fit inside a fixed box on the fine grid, with every country listed, ranked, at one decimal; the quiet ones last. Small ambient pings ring out all the time where people are, by share. The page's toggles sit on the key's line; Night shading dims where it's night now.">
  <div class="controls"><DemoButton onclick={newCounts}>New counts</DemoButton></div>
  <section class="band">
    <div class="live">
      <WorldMap {countries} bind:lit={liveLit} digits={1} {night} fit ambient world={worldDotsFine} label="Sample world map">
        {#snippet tools()}
          <LinkButton variant="outline" pressed={night} onclick={() => (night = !night)}>Night shading</LinkButton>
        {/snippet}
      </WorldMap>
      <div class="list"><CountryRanking {countries} bind:lit={liveLit} digits={1} /></div>
    </div>
  </section>
</Specimen>

<Specimen title="Loading" bleed note="Until the count arrives a light sweeps across the gray dots and shimmering rows hold the places.">
  <Variant label="Loading">
    <section class="band">
      <div class="home">
        <WorldMap countries={null} label="Sample world map" />
        <CountryRanking countries={null} limit={8} />
      </div>
    </section>
  </Variant>
</Specimen>

<style>
.controls {
  display: flex;
  gap: var(--space-sm-inline);
  margin-block-end: var(--space-md-block);
}

.band {
  padding: var(--home-band-padding-block) var(--home-gutter);
  background: var(--color-home-band);
  color: var(--color-home-text);
}

.home {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--home-band-side);
  gap: var(--home-band-gap);
  align-items: center;
}

.live {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--live-side-width);
  gap: var(--home-band-gap);
  block-size: var(--live-stacked-map-height);
}

.list {
  overflow-y: auto;
}
</style>
