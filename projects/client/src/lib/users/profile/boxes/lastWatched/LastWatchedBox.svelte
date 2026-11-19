<!--
  Last Watched: the newest play over its fanart, with how long ago in the frosted band: a movie with its year by the title, an episode with
  its number in bold, the summary watched button's purple bar through the show, and the episodes beside OG's progress
  pie with the percent at the end. Nothing yet, a plain card.
-->
<script lang="ts">
import { progressPercent } from '#lib/components/media/progressPercent.ts';
import Stat from '#lib/components/stats/Stat.svelte';
import BoxProgress from '#lib/components/users/profile-box/BoxProgress.svelte';
import BoxTitle from '#lib/components/users/profile-box/BoxTitle.svelte';
import ProfileBox from '#lib/components/users/profile-box/ProfileBox.svelte';
import { pieSvg } from '#lib/icons/pieSvg.ts';
import type { LastWatchedView } from './LastWatchedView.ts';

const { view }: { view: LastWatchedView } = $props();
const play = $derived(view.play);
</script>

{#snippet foot()}Watched {play?.when}{/snippet}

<ProfileBox label="Last Watched" image={play?.image ?? null} foot={play ? foot : undefined}>
  {#if play}
    <BoxTitle title={play.title} year={play.year} subtitle={play.subtitle} />
    {#if play.progress}
      {@const { completed, aired } = play.progress}
      <BoxProgress value={completed} max={aired} label="{completed} of {aired} episodes watched" />
      <p class="progress">
        <Stat svg={pieSvg(completed / aired)} tone="watched" value="{completed} / {aired}" noun="episodes" />
        <b>{progressPercent(play.progress)}%</b>
      </p>
    {/if}
  {:else}
    <BoxTitle title={{ text: 'Nothing watched yet!' }} />
  {/if}
</ProfileBox>

<style>
.progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0 0;
  font-size: var(--font-size-small);

  b {
    font-family: var(--font-headings);
    font-weight: var(--font-weight-headings-heavy);
  }
}
</style>
