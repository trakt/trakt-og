<!--
  The four boxes under a profile's frame, picked by the loader: cards with a gap between them. Four across, two from
  tablet width, one on phones. With more boxes worth showing, the dashboard's less and more pill on the strip's bottom
  edge opens a second row of up to four. The browser remembers the choice for every profile, like the dashboard's rows.
-->
<script lang="ts">
import { trackDrilldowns } from '#lib/analytics/trackDrilldowns.ts';
import { browser } from '$app/env';
import Container from '#lib/components/container/Container.svelte';
import PageNavigator from '#lib/components/page-navigator/PageNavigator.svelte';
import { savedRows } from '#lib/dashboard/savedRows.ts';
import { profileBoxComponent } from './profileBoxComponent.ts';
import type { toProfileBoxes } from './toProfileBoxes.ts';

type Boxes = Awaited<ReturnType<typeof toProfileBoxes>>;

const { boxes }: { boxes: Boxes } = $props();
const ROWS_KEY = 'profile-boxes';
let rows = $state(browser ? (savedRows.read(ROWS_KEY) ?? 1) : 1);

function changeRows(next: number) {
  rows = next;
  savedRows.write(ROWS_KEY, next);
}
</script>

{#snippet row(entries: Boxes['shown'])}
  <div class="grid" {@attach trackDrilldowns({ source: 'profile-stats' })}>
    {#each entries as box (box.key)}
      {@const Box = profileBoxComponent(box.key)}
      {#if Box}<Box view={box.view} />{/if}
    {/each}
  </div>
{/snippet}

<section class={['boxes', { paged: boxes.more.length > 0 }]} aria-label="Stats">
  <Container>
    {@render row(boxes.shown)}
    {#if boxes.more.length > 0 && rows > 1}{@render row(boxes.more)}{/if}
  </Container>
  {#if boxes.more.length > 0}
    <PageNavigator label="profile boxes" rows={Math.min(rows, 2)} maxRows={2} onchange={changeRows} dark edge />
  {/if}
</section>

<style>
.boxes {
  position: relative;
  padding-block: var(--profile-boxes-padding-block);
  background-color: var(--color-profile-boxes-bg);
  color: var(--color-card-text);

  &.paged {
    padding-block-end: var(--profile-boxes-padding-more);
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--profile-box-gap);

  & + & {
    margin-block-start: var(--profile-box-gap);
  }

  @media (max-width: 991px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 767px) {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
