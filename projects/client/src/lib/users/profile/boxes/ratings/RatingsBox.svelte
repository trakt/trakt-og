<!-- Ratings: the average, the spread from 1 to 10 with the most used score in full white, and the latest 10. -->
<script lang="ts">
import BoxChips from '$lib/components/users/profile-box/BoxChips.svelte';
import BoxFigure from '$lib/components/users/profile-box/BoxFigure.svelte';
import ProfileBox from '$lib/components/users/profile-box/ProfileBox.svelte';
import type { RatingsView } from './RatingsView.ts';

const { view }: { view: RatingsView } = $props();
</script>

<ProfileBox tone="ratings">
  <BoxChips chips={[{ text: 'Ratings' }, { text: view.total, alt: true }]} />
  <BoxFigure value={view.average} label={['average', 'out of 10']} />
  <div class="bars" role="img" aria-label={view.chartLabel}>
    {#each view.bars as bar, i (i)}<i class={{ mode: bar.mode }} style:--height="{bar.height}%" title={bar.title}></i>{/each}
  </div>
  <div class="axis" aria-hidden="true">{#each view.bars as _, i (i)}<span>{i + 1}</span>{/each}</div>
  <p class="line">
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    {#if view.latestTen}Latest 10: <a href={view.latestTen.href}><b>{view.latestTen.text}</b></a> ·{/if}
    {view.comments}
  </p>
</ProfileBox>

<style>
.bars,
.axis {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 3px;
}

.bars {
  align-items: end;
  block-size: var(--profile-box-hist-height);
  margin-block-start: 8px;

  i {
    block-size: var(--height);
    min-block-size: 2px;
    border-radius: var(--radius-profile-box-mark) var(--radius-profile-box-mark) 0 0;
    background-color: var(--color-profile-mark-dim);

    &.mode {
      background-color: var(--color-profile-mark);
    }
  }
}

.axis {
  margin-block-start: 2px;
  color: var(--color-profile-ink-faint);
  font-size: var(--font-size-profile-axis);
  text-align: center;
}

.line {
  margin: 6px 0 0;
  overflow: hidden;
  color: var(--color-profile-ink-soft);
  font-size: var(--font-size-small);
  white-space: nowrap;
  text-overflow: ellipsis;

  b {
    color: var(--color-card-text);
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings);
  }
}
</style>
