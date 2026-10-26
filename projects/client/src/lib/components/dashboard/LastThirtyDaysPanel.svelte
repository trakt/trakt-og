<!--
  The dashboard's Last 30 Days panel: the keys with the time, episodes, movies and best week, the minutes-per-day
  chart under them, and the genre band. With nothing watched OG hid the chart, and the whole panel when the genres were
  empty too. Pass the unawaited `fetchLastThirtyDays` promise from the loader, so the page streams in and shimmering
  keys, chart and band hold their place until it lands, and it fails on its own if it doesn't.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import LoadFailed from '$lib/components/empty/LoadFailed.svelte';
import Shimmer from '$lib/components/loading/Shimmer.svelte';
import GenreBand from '$lib/components/users/GenreBand.svelte';
import type { LastThirtyDays } from '$lib/dashboard/LastThirtyDays';
import chartSimple from '$lib/icons/regular/chart-simple.svg?raw';
import DashboardPanel from './DashboardPanel.svelte';
import MinutesChart from './MinutesChart.svelte';
import WatchedKeys from './WatchedKeys.svelte';

const { stats }: { stats: Promise<LastThirtyDays> } = $props();
</script>

{#snippet panel(loading: boolean, content: Snippet)}
  <DashboardPanel --panel-padding-end="0" title="Last 30 Days" icon={chartSimple} {loading}>
    {@render content()}
  </DashboardPanel>
{/snippet}

{#await stats}
  {@render panel(true, pending)}
{:then last}
  {#if last.chart || last.genres.length > 0}
    {#snippet charts()}
      <div class="charts">
        {#if last.chart}
          <div class="block keys"><WatchedKeys keys={last.keys} /></div>
          <div class="block chart"><MinutesChart chart={last.chart} /></div>
        {/if}
        {#if last.genres.length > 0}
          <div class="block"><GenreBand genres={last.genres} /></div>
        {/if}
      </div>
    {/snippet}
    {@render panel(false, charts)}
  {/if}
{:catch error}
  {#snippet failed()}
    <div class="notice">
      <LoadFailed what="Last 30 Days" {error} />
    </div>
  {/snippet}
  {@render panel(false, failed)}
{/await}

{#snippet pending()}
  <div class="shimmers">
    <div class="block keys shimmer-keys">
      {#each Array.from({ length: 4 }, (_, i) => i) as key (key)}
        <Shimmer inline="100%" block="var(--minutes-shimmer-keys-height)" />
      {/each}
    </div>
    <div class="block chart"><Shimmer inline="100%" block="var(--minutes-shimmer-chart-height)" /></div>
    <div class="block band-shimmer">
      <Shimmer inline="100%" block="var(--genre-band-height)" />
      <div class="shimmer-keys genre-keys">
        {#each Array.from({ length: 6 }, (_, i) => i) as key (key)}
          <Shimmer inline="100%" block="var(--minutes-shimmer-genre-keys-height)" />
        {/each}
      </div>
    </div>
  </div>
{/snippet}

<style>
/* the panel fades in when its data lands, as OG's lazy panels did. */
.charts {
  animation: fade-in var(--transition-card) ease-out;
}

.charts,
.shimmers {
  padding-block-start: var(--gutter);
}

/* The keys' places, in the keys' own columns: four stats, then six genres under the band. */
.shimmer-keys {
  --key-columns: 4;
  display: grid;
  grid-template-columns: repeat(var(--key-columns), minmax(0, 1fr));
  gap: var(--space-genre-keys-column);

  &.genre-keys {
    --key-columns: 6;
  }
}

.band-shimmer {
  display: grid;
  gap: var(--space-genre-keys-row);
}

/* OG's `#charts-wrapper .row > div`. */
.block {
  padding-block-end: var(--gutter);
}

/* The stat keys sit apart from the week totals under them. */
.keys {
  padding-block-end: var(--space-minutes-keys);
}

/* The chart sits apart from the genre band under it. */
.chart {
  padding-block-end: var(--space-minutes-genres);
}

.notice {
  padding-block: var(--gutter);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .charts {
    animation: none;
  }
}
</style>
