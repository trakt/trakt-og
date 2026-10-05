<!-- Finished: shows finished, the share of started shows that is, and the latest one. -->
<script lang="ts">
import BoxChips from '$lib/components/users/profile-box/BoxChips.svelte';
import BoxFigure from '$lib/components/users/profile-box/BoxFigure.svelte';
import BoxProgress from '$lib/components/users/profile-box/BoxProgress.svelte';
import ProfileBox from '$lib/components/users/profile-box/ProfileBox.svelte';
import Icon from '$lib/icons/Icon.svelte';
import circleCheck from '$lib/icons/solid/circle-check.svg?raw';
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

<ProfileBox tone="finished" {foot}>
  <span class="check"><Icon svg={circleCheck} /></span>
  <BoxChips chips={[{ text: 'Finished' }, { text: 'Shows', alt: true }]} />
  <BoxFigure value={view.count} label={['shows', 'finished']} />
  <BoxProgress
    value={view.finished}
    max={view.started}
    label="{view.finished} of {view.started} started shows finished"
    caption={[view.share, view.month ?? '']}
  />
</ProfileBox>

<style>
.check {
  position: absolute;
  inset-block-start: var(--profile-box-padding-block);
  inset-inline-end: var(--profile-box-padding-block);
  color: var(--color-profile-mark);
  font-size: var(--profile-box-check-size);
  line-height: 1;
}
</style>
