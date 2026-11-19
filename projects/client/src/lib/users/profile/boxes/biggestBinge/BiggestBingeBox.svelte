<!-- Recent Binge: the most episodes of one show in one day this month, one pip per episode, the day in the band. -->
<script lang="ts">
import BoxFigure from '#lib/components/users/profile-box/BoxFigure.svelte';
import BoxTitle from '#lib/components/users/profile-box/BoxTitle.svelte';
import ProfileBox from '#lib/components/users/profile-box/ProfileBox.svelte';
import fire from '#lib/icons/solid/fire.svg?raw';
import type { BiggestBingeView } from './BiggestBingeView.ts';

const { view }: { view: BiggestBingeView } = $props();
</script>

{#snippet foot()}{view.day}{/snippet}

<ProfileBox label="Recent Binge" tone="binge" mark={fire} {foot}>
  <BoxFigure value={String(view.episodes)} label="episodes in one day" />
  <div class="pips" aria-hidden="true">
    {#each { length: view.episodes }, i (i)}<i></i>{/each}
  </div>
  <BoxTitle title={view.show} />
</ProfileBox>

<style>
.pips {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  max-block-size: 19px;
  margin-block: 6px 10px;
  overflow: hidden;

  i {
    inline-size: var(--profile-box-pip-width);
    block-size: var(--profile-box-pip-height);
    border-radius: var(--radius-profile-box-mark);
    background-color: var(--color-profile-mark);
  }
}
</style>
