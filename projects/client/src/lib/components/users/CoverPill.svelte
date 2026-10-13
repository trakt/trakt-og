<!--
  A glass pill on a cover photo: the profile's location, gender and age, and join date, and the dashboard greeting's
  join date. A leading icon is muted and a <b> inside stands out in white.
    <CoverPill title="Joined September 25, 2010"><Icon svg={calendar} />Joined <b>2010</b></CoverPill>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

const { title, children }: { title?: string; children: Snippet } = $props();
</script>

<span class="pill" {title}>{@render children()}</span>

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
}
</style>
