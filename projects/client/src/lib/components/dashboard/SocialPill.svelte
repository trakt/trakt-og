<!--
  The status pill on a tile or a row: a pulsing red dot for "Watching now", a still green one for a sitting that ended
  within the hour, or no dot at all (see StatusDot).
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import StatusDot from '$lib/components/status/StatusDot.svelte';

interface Props {
  dot?: 'live' | 'done';
  /** Over a still, or on the panel's own background. */
  onImage?: boolean;
  children: Snippet;
}

const { dot, onImage = false, children }: Props = $props();
</script>

<span class={['pill', { 'on-image': onImage }]}>
  {#if dot}<StatusDot kind={dot} />{/if}
  {@render children()}
</span>

<style>
.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm-block);
  padding: var(--space-social-pill);
  border: 1px solid var(--color-social-line);
  border-radius: var(--social-pill-radius);
  background-color: var(--color-social-chip-bg);
  font-size: var(--font-size-social-pill);
  font-weight: bold;
  white-space: nowrap;

  &.on-image {
    border-color: transparent;
    background-color: var(--color-social-pill-on-image);
    color: var(--color-social-on-image);
  }
}
</style>
