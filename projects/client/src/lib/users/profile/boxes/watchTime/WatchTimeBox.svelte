<!-- Watch Time: hours in the last 30 days, a bar per day with the busiest in full white, all time in the footer. -->
<script lang="ts">
import BoxChips from '$lib/components/users/profile-box/BoxChips.svelte';
import BoxFigure from '$lib/components/users/profile-box/BoxFigure.svelte';
import ProfileBox from '$lib/components/users/profile-box/ProfileBox.svelte';
import type { WatchTimeView } from './WatchTimeView.ts';

const { view }: { view: WatchTimeView } = $props();
</script>

{#snippet foot()}
  All time <b>{view.allTime.time}</b> · {view.allTime.episodes} · {view.allTime.movies}
{/snippet}

<ProfileBox tone="stats" {foot}>
  <BoxChips chips={[{ text: 'Last 30 Days' }, { text: 'Watched', alt: true }]} />
  <BoxFigure value={view.hours} label={[view.summary]} />
  <div class="bars" role="img" aria-label={view.chartLabel}>
    {#each view.days as day, i (i)}
      <i class={{ peak: day.peak, zero: day.height === 0 }} style:--height="{day.height}%" title={day.title}></i>
    {/each}
  </div>
</ProfileBox>

<style>
.bars {
  display: flex;
  align-items: flex-end;
  gap: var(--profile-box-bars-gap);
  block-size: var(--profile-box-bars-height);
  margin-block-start: 10px;

  i {
    flex: 1;
    block-size: var(--height);
    min-block-size: 2px;
    border-radius: var(--radius-profile-box-mark) var(--radius-profile-box-mark) 0 0;
    background-color: var(--color-profile-mark-dim);

    &.peak {
      background-color: var(--color-profile-mark);
    }

    &.zero {
      background-color: var(--color-profile-track);
    }
  }
}
</style>
