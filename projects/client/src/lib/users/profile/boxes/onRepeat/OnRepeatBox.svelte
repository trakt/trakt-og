<!-- On Repeat: the most rewatched title over its fanart, with a giant multiplier, and how often in the band. -->
<script lang="ts">
import BoxTitle from '#lib/components/users/profile-box/BoxTitle.svelte';
import ProfileBox from '#lib/components/users/profile-box/ProfileBox.svelte';
import Icon from '#lib/icons/Icon.svelte';
import xmark from '#lib/icons/solid/xmark.svg?raw';
import type { OnRepeatView } from './OnRepeatView.ts';

const { view }: { view: OnRepeatView } = $props();
</script>

{#snippet foot()}
  {#if view.last}Seen <b>{view.times}</b> times, last on {view.last}{:else}<b>{view.times}</b> full runs and counting{/if}
{/snippet}

<ProfileBox label="On Repeat" image={view.image ?? null} {foot}>
  <p class="times" aria-hidden="true"><span class="sign"><Icon svg={xmark} /></span><span class="number">{view.times}</span></p>
  <BoxTitle title={view.title} year={view.year} />
</ProfileBox>

<style>
/* The × centred on the number's height: the number's box is trimmed to its digits, cap height to baseline. */
.times {
  position: absolute;
  inset-block-start: var(--profile-box-multiplier-top);
  inset-inline-end: var(--profile-box-padding);
  display: flex;
  align-items: center;
  gap: var(--profile-box-multiplier-gap);
  margin: 0;
  color: var(--color-profile-multiplier);
  font-family: var(--font-profile-figure);
  font-size: var(--font-size-profile-multiplier);
  font-weight: var(--font-weight-profile-figure);
  line-height: 1;
  text-shadow: var(--text-shadow-profile-multiplier);
}

.number {
  text-box: trim-both cap alphabetic;
}

.sign {
  display: flex;
  font-size: var(--font-size-profile-multiplier-sign);
  filter: var(--filter-profile-multiplier-sign);
}
</style>
