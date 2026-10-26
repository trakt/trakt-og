<!--
  A tooltip's top section: out to the box's edges and top corners, a shade up from it over a divider, like
  `TooltipFooter` turned over. It sets what the tooltip describes apart from what's yours: the season grid's episode
  over when you watched it. One per tooltip, first.
    <TooltipHeader><img src={screenshot} alt="" />1x11 Pilot</TooltipHeader>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

const { children }: { children: Snippet } = $props();
</script>

<span class="tooltip-header">{@render children()}</span>

<style>
.tooltip-header {
  display: grid;
  margin: calc(-1 * var(--space-tooltip-block)) calc(-1 * var(--space-tooltip-inline)) var(--space-tooltip-block);
  padding: var(--space-tooltip);
  border-block-end: 1px solid var(--color-tooltip-divider);
  border-start-start-radius: calc(var(--radius-tooltip) - 1px);
  border-start-end-radius: calc(var(--radius-tooltip) - 1px);
  background-color: var(--color-tooltip-footer);
}
</style>
