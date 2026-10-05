<!-- Last Watched: the newest play over its fanart, how long ago, and for a show the progress through it. -->
<script lang="ts">
import BoxChips from '$lib/components/users/profile-box/BoxChips.svelte';
import BoxProgress from '$lib/components/users/profile-box/BoxProgress.svelte';
import BoxTitle from '$lib/components/users/profile-box/BoxTitle.svelte';
import ProfileBox from '$lib/components/users/profile-box/ProfileBox.svelte';
import type { LastWatchedView } from './LastWatchedView.ts';

const { view }: { view: LastWatchedView } = $props();
const play = $derived(view.play);
</script>

{#snippet bottom()}
  {#if play}
    <BoxTitle title={play.title} subtitle={play.subtitle} />
    {#if play.progress}
      {@const { completed, aired } = play.progress}
      <BoxProgress
  value={completed}
  max={aired}
  label="{completed} of {aired} episodes watched"
  caption={[`${completed} of ${aired} episodes`, `${Math.round((completed / aired) * 100)}%`]}
/>
    {/if}
  {:else}
    <BoxChips chips={[{ text: 'Last Watched', alt: true }]} />
    <BoxTitle title={{ text: 'Nothing watched yet!' }} />
  {/if}
{/snippet}

<ProfileBox image={play ? play.image ?? null : undefined} placeholder={!play} {bottom}>
  {#if play}<BoxChips chips={[{ text: 'Last Watched', alt: true }, { text: play.when }]} />{/if}
</ProfileBox>
