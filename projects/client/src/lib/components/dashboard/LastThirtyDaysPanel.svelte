<!--
  The dashboard's Last 30 Days panel: the keys with the time, episodes, movies and best week, the minutes-per-day
  chart under them, and the genre band. With nothing watched OG hid the chart, and the whole panel when the genres were
  empty too. Pass the unawaited `fetchLastThirtyDays` promise from the loader, so the page streams in and this panel
  spins until it lands, and fails on its own if it doesn't.
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import NoData from '$lib/components/empty/NoData.svelte';
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
{:catch}
  {@render panel(false, failed)}
{/await}

{#snippet pending()}{/snippet}

{#snippet failed()}
  <div class="notice">
  <NoData>The last 30 days didn't load. Refresh the page to try again.</NoData>
</div>
{/snippet}

<style>
/* the panel fades in when its data lands, as OG's lazy panels did. */
.charts {
  padding-block-start: var(--gutter);
  animation: fade-in var(--transition-card) ease-out;
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
