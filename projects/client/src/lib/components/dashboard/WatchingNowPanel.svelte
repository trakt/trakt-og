<!--
  What the people the viewer follows are watching now, a panel of its own while anyone is: fanart cards, three across,
  with the less and more pill for the rest. It reads from the page's `SocialCircle`, which asks every 2 minutes while
  the tab is visible.
-->
<script lang="ts">
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
import PosterGrid from '#lib/components/media/PosterGrid.svelte';
import { visibleColumns } from '#lib/components/media/visibleColumns.ts';
import PageNavigator from '#lib/components/page-navigator/PageNavigator.svelte';
import { rowCount } from '#lib/dashboard/rowCount.ts';
import type { SocialCircle } from '#lib/dashboard/socialCircle.svelte.ts';
import userGroup from '#lib/icons/regular/user-group.svg?raw';
import DashboardPanel from './DashboardPanel.svelte';
import PanelCounts from './PanelCounts.svelte';
import SocialTile from './SocialTile.svelte';

const { circle }: { circle: SocialCircle } = $props();

/** The poster grid's columns; the live cards take two each. */
const PER_ROW = 6;
const LIVE_PER_ROW = 3;

let rows = $state(1);
let width = $state(0);
// Half the poster grid's columns, as the container query below sets: three, two on smaller tablets.
const perRow = $derived(Math.max(2, visibleColumns(width, PER_ROW) / 2));
const tiles = $derived(circle.tiles);
const pages = $derived(rowCount({ rows, items: tiles.length, perRow, maxRows: tiles.length }));
</script>

{#if tiles.length > 0}
  {#snippet navigator()}
    <PageNavigator label="Watching Now" rows={pages.rows} maxRows={pages.maxRows} onchange={(next) => (rows = next)}
      edge />
  {/snippet}
  {#snippet count()}
    <PanelCounts counts={[{ svg: userGroup, count: tiles.length, one: 'person', many: 'people' }]} />
  {/snippet}
  {#snippet help()}From people you follow.{/snippet}
  <DashboardPanel --panel-bg="var(--color-social-live-bg)" title="Watching Now" live {help} footer={navigator}
    aside={count}>
    <div class="live" bind:clientWidth={width} {@attach trackDrilldowns({ source: 'social-feed' })}>
      <PosterGrid columns={LIVE_PER_ROW} phoneColumns={2}>
        {#each tiles.slice(0, pages.rows * perRow) as tile (tile.watch.member.key)}
          <SocialTile {tile} />
        {/each}
      </PosterGrid>
    </div>
  </DashboardPanel>
{/if}

<style>
/* Under its heading over the grid's own gutter, then a little room before the less and more pill, which hangs over
   the panel's edge. */
.live {
  container-type: inline-size;
  margin-block-start: var(--space-social-live-top);
  margin-block-end: calc(var(--space-social-live-end) - var(--gutter));
}

/* Smaller tablets: two across, half the width each. */
@container (width < 940px) {
  .live :global(.poster-grid) {
    --visible: 2;
  }
}
</style>
