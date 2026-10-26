<!--
  A glass pill on a cover photo: the profile's private status, location and join date, and the
  dashboard greeting's join date. A leading icon is muted and a <b> inside stands out in white. `tone="private"` tints
  it amber, icon and all, so a status reads apart from the facts next to it.
    <CoverPill title="Joined September 25, 2010"><Icon svg={calendar} />Joined <b>2010</b></CoverPill>
-->
<script lang="ts">
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import type { Snippet } from 'svelte';

const { title, tone, children }: { title?: string; tone?: 'private'; children: Snippet } = $props();
</script>

<Tooltip text={title}>
  {#snippet trigger(tooltip)}<span class={['pill', tone]} {...tooltip}>{@render children()}</span>{/snippet}
</Tooltip>

<style>
.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs-inline);
  block-size: var(--profile-pill-height);
  padding-inline: var(--profile-pill-padding);
  border: 1px solid var(--color-profile-pill-border);
  border-radius: calc(var(--profile-pill-height) / 2);
  background-color: var(--color-profile-pill-bg);
  backdrop-filter: var(--blur-profile-pill);
  color: var(--color-profile-pill-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-profile-pill);
  font-variant-numeric: tabular-nums;
  text-shadow: none;
  white-space: nowrap;

  & :global(b) {
    color: var(--color-text-inverse);
    font-weight: var(--font-weight-headings-heavy);
  }

  & :global(.icon) {
    color: var(--color-profile-pill-icon);
  }

  &.private {
    border-color: var(--color-profile-pill-private-border);
    background-color: var(--color-profile-pill-private-bg);
    color: var(--color-profile-pill-private-text);
    font-weight: var(--font-weight-headings-heavy);

    & :global(.icon) {
      color: inherit;
    }
  }
}
</style>
