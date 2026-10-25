<!--
  A panel's first row of cards while they load, as shimmering cards in its poster grid. Only that row shows, so the
  four columns of a smaller tablet or a phone's two don't stack the rest under it.
-->
<script lang="ts">
import PosterGrid from '$lib/components/media/PosterGrid.svelte';
import CardShimmer from './CardShimmer.svelte';

interface Props {
  /** Columns at desktop width, as the loaded grid has. */
  columns: number;
  phoneColumns?: number;
  ratio: 'poster' | 'fanart';
}

const { columns, phoneColumns, ratio }: Props = $props();
</script>

<div class="card-shimmer-row">
  <PosterGrid {columns} {phoneColumns}>
    {#each Array.from({ length: columns }, (_, i) => i) as slot (slot)}
      <CardShimmer {ratio} />
    {/each}
  </PosterGrid>
</div>

<style>
.card-shimmer-row :global(.poster-grid) {
  grid-template-rows: auto;
  grid-auto-rows: 0;
  row-gap: 0;
  overflow: hidden;
}
</style>
