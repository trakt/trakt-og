<!--
  A social panel's counts on its heading's line, as tall as the h2 and centered on it. Each count is its icon and
  number; what it counts is the tooltip, "Titles".
-->
<script lang="ts">
import Stat from '#lib/components/stats/Stat.svelte';

type Count = { svg: string; count: number; one: string; many: string };

const { counts }: { counts: readonly Count[] } = $props();
</script>

<span class="stats">
  {#each counts as { svg, count, one, many } (one)}
    {@const noun = count === 1 ? one : many}
    <Stat {svg} value={count.toLocaleString('en-US')} {noun} label={noun.charAt(0).toUpperCase() + noun.slice(1)} bare />
  {/each}
</span>

<style>
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-stats);
  align-items: center;
  min-block-size: calc(var(--font-size-h2) * var(--line-height-headings));
}
</style>
