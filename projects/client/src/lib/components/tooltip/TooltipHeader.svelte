<!--
  A tooltip's header: out to the box's edges on the side away from the arrow, a shade up from the box over a divider. It
  names what the tooltip describes when its trigger doesn't: the season grid's episode, a chart's season, genre or
  day. One per tooltip, first.
    <TooltipHeader><img src={screenshot} alt="" />1x11 Pilot</TooltipHeader>
  `band` adds a strip in the footer's shade between it and the body, for what that thing looks like: a progress bar,
  a split. The header then goes a shade lighter again, so the shades step up away from the arrow.
    <TooltipHeader band={bar}>Season 2</TooltipHeader>
  In a flipped box it mirrors: it sits at the bottom, its band over it, still away from the arrow.
-->
<script lang="ts">
import type { Snippet } from 'svelte';

const { children, band }: { children: Snippet; band?: Snippet } = $props();
</script>

<span class="tooltip-header">
  <span class={['name', { banded: Boolean(band) }]}>{@render children()}</span>
  {#if band}<span class="band">{@render band()}</span>{/if}
</span>

<style>
.tooltip-header {
  display: flex;
  flex-direction: var(--tooltip-stack, column);
  margin: calc(-1 * var(--space-tooltip-block)) calc(-1 * var(--space-tooltip-inline)) var(--space-tooltip-block);
  overflow: clip;
  border-block-end: 1px solid var(--color-tooltip-divider);
  border-start-start-radius: calc(var(--radius-tooltip) - 1px);
  border-start-end-radius: calc(var(--radius-tooltip) - 1px);
}

.name {
  display: grid;
  padding: var(--space-tooltip);
  background-color: var(--color-tooltip-footer);

  &.banded {
    background-color: var(--color-tooltip-header);
  }
}

.band {
  display: grid;
  gap: var(--space-tooltip-footer-gap);
  padding: var(--space-tooltip-footer);
  border-block-start: 1px solid var(--color-tooltip-divider);
  background-color: var(--color-tooltip-footer);
}

:global(.flipped) .tooltip-header {
  margin-block: var(--space-tooltip-block) calc(-1 * var(--space-tooltip-block));
  border-block-start: 1px solid var(--color-tooltip-divider);
  border-block-end: 0;
  border-radius: 0 0 calc(var(--radius-tooltip) - 1px) calc(var(--radius-tooltip) - 1px);

  & .band {
    border-block-start: 0;
    border-block-end: 1px solid var(--color-tooltip-divider);
  }
}
</style>
