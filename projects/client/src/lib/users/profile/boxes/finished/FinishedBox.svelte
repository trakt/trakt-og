<!--
  Shows Finished, as the dashboard counts them: finished of the shows watched, a meter of finished then in progress
  (dropped is the track left), the in progress and dropped counts, and the latest finish, or none lately, in a band
  along the bottom.
-->
<script lang="ts">
import Stat from '#lib/components/stats/Stat.svelte';
import BoxFigure from '#lib/components/users/profile-box/BoxFigure.svelte';
import ProfileBox from '#lib/components/users/profile-box/ProfileBox.svelte';
import ban from '#lib/icons/regular/ban.svg?raw';
import barsProgress from '#lib/icons/regular/bars-progress.svg?raw';
import circleCheck from '#lib/icons/solid/circle-check.svg?raw';
import type { FinishedView } from './FinishedView.ts';

const { view }: { view: FinishedView } = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#snippet foot()}
  {#if view.latest}
    Latest: <a href={view.latest.title.href}><b>{view.latest.title.text}</b></a>, {view.latest.when}
  {:else}
    Nothing finished lately
  {/if}
{/snippet}

<ProfileBox label="Shows Finished" tone="finished" mark={circleCheck} {foot}>
  <div class="figure"><BoxFigure value={view.finished} label="of {view.watched}" /></div>
  {#if view.meter}
    <div class="meter" role="img"
      aria-label="{view.finished} finished, {view.inProgress.toLocaleString('en-US')} in progress, {view.dropped.toLocaleString('en-US')} dropped">
      <i style:--share="{view.meter.finished}%"></i>
      <i style:--share="{view.meter.inProgress}%"></i>
    </div>
  {/if}
  <p class="stats">
    <Stat svg={barsProgress} value={view.inProgress.toLocaleString('en-US')} noun="in progress" />
    <Stat svg={ban} value={view.dropped.toLocaleString('en-US')} noun="dropped" />
  </p>
</ProfileBox>

<style>
/* "of 114" is a number too, so it reads a size up from a figure's words. */
.figure {
  --font-size-profile-figure-label: var(--font-size-profile-figure-label-large);
}

/* Finished, then in progress; dropped is the track that's left, like the dashboard's. */
.meter {
  display: flex;
  overflow: hidden;
  block-size: var(--profile-box-meter-height);
  margin-block-start: 4px;
  border-radius: var(--radius-profile-box-mark);
  background-color: var(--color-profile-track);

  i {
    inline-size: var(--share);
    background-color: var(--color-profile-mark);

    & + i {
      background-color: var(--color-profile-mark-dim);
    }
  }
}

/* Blue icons, lifted off the green by a soft dark shadow. */
.stats {
  --color-stat-count: var(--color-profile-stats-icon);
  filter: var(--filter-profile-stats-shadow);
  display: flex;
  gap: var(--profile-box-stats-gap);
  margin: 6px 0 0;
}
</style>
