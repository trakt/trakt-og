<!--
  A tooltip's bottom section: out to the box's edges and bottom corners, a shade up from it under a divider. The
  progress tooltips put their bar here, the library tooltip its format and audio. One per tooltip, last.
    <TooltipFooter><CollectionLogoRow {badges} /></TooltipFooter>
  `between` is the same band between two sections, with a divider under it too: a rewatch's bar under its own run.
    <TooltipFooter between><span class="bar"></span></TooltipFooter>
-->
<script lang="ts">
import type { Snippet } from 'svelte';

const { children, between = false }: { children: Snippet; between?: boolean } = $props();
</script>

<span class={['tooltip-footer', { between }]}>{@render children()}</span>

<style>
.tooltip-footer {
  display: grid;
  gap: var(--space-tooltip-footer-gap);
  margin: var(--space-tooltip-block) calc(-1 * var(--space-tooltip-inline)) calc(-1 * var(--space-tooltip-block));
  padding: var(--space-tooltip-footer);
  border-block-start: 1px solid var(--color-tooltip-divider);
  border-end-start-radius: calc(var(--radius-tooltip) - 1px);
  border-end-end-radius: calc(var(--radius-tooltip) - 1px);
  background-color: var(--color-tooltip-footer);

  &.between {
    margin-block-end: var(--space-tooltip-block);
    border-block-end: 1px solid var(--color-tooltip-divider);
    border-radius: 0;
  }
}
</style>
