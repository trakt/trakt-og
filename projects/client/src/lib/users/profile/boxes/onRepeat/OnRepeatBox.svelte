<!-- On Repeat: the most rewatched title over its fanart, with a giant multiplier. -->
<script lang="ts">
import BoxChips from '$lib/components/users/profile-box/BoxChips.svelte';
import BoxTitle from '$lib/components/users/profile-box/BoxTitle.svelte';
import ProfileBox from '$lib/components/users/profile-box/ProfileBox.svelte';
import type { OnRepeatView } from './OnRepeatView.ts';

const { view }: { view: OnRepeatView } = $props();
const chips = $derived([{ text: 'On Repeat', alt: true }, ...(view.others ? [{ text: view.others }] : [])]);
</script>

{#snippet bottom()}
  <BoxChips {chips} />
  <BoxTitle title={view.title} subtitle={{ text: view.line }} />
{/snippet}

<ProfileBox image={view.image ?? null} {bottom}>
  <p class="times" aria-hidden="true"><small>×</small>{view.times}</p>
</ProfileBox>

<style>
.times {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 16px;
  margin: 0;
  color: var(--color-profile-multiplier);
  font-family: var(--font-headings);
  font-size: var(--font-size-profile-multiplier);
  font-weight: var(--font-weight-profile-figure);
  letter-spacing: var(--letter-spacing-profile-multiplier);
  line-height: 1;
  text-shadow: var(--text-shadow-profile-multiplier);

  small {
    margin-inline-end: 2px;
    font-size: var(--font-size-profile-multiplier-sign);
    letter-spacing: 0;
    vertical-align: 14px;
  }
}
</style>
