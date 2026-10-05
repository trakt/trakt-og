<!-- Biggest Binge: the most episodes of one show in one day this month, one pip per episode. -->
<script lang="ts">
import BoxChips from '$lib/components/users/profile-box/BoxChips.svelte';
import BoxFigure from '$lib/components/users/profile-box/BoxFigure.svelte';
import BoxTitle from '$lib/components/users/profile-box/BoxTitle.svelte';
import ProfileBox from '$lib/components/users/profile-box/ProfileBox.svelte';
import type { BiggestBingeView } from './BiggestBingeView.ts';

const { view }: { view: BiggestBingeView } = $props();
</script>

{#snippet bottom()}
  <BoxTitle title={view.show} subtitle={{ text: view.day }} />
{/snippet}

<ProfileBox tone="binge" {bottom}>
  <BoxChips chips={[{ text: 'Biggest Binge' }, { text: 'Last 30 Days', alt: true }]} />
  <BoxFigure value={String(view.episodes)} label={['episodes', 'in one day']} />
  <div class="pips" aria-hidden="true">
    {#each { length: view.episodes }, i (i)}<i></i>{/each}
  </div>
</ProfileBox>

<style>
.pips {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  max-block-size: 19px;
  margin-block-start: 10px;
  overflow: hidden;

  i {
    inline-size: var(--profile-box-pip-width);
    block-size: var(--profile-box-pip-height);
    border-radius: var(--radius-profile-box-mark);
    background-color: var(--color-profile-mark);
  }
}
</style>
