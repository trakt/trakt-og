<!--
  The tooltip's box: dark, with a hairline border and an arrow pointing back at what it describes. `side` is where the
  box sits from its trigger, so a `top` box has its arrow on its bottom edge. `Tooltip` draws every tooltip in one.
  Use it directly only where a tooltip can't be a `Tooltip` popover (the reactions panel, the list picker's counts),
  inside an element that places it. That element can move the arrow along its edge with `--tooltip-arrow-at`.
    <span class="tip"><TooltipBox side="left">12 items</TooltipBox></span>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { TooltipPlacement } from './TooltipPlacement.ts';

const { side = 'top', children }: { side?: TooltipPlacement; children: Snippet } = $props();
</script>

<span class={['tooltip-box', side]}>{@render children()}</span>

<style>
/* The arrow: a triangle in the border's color, and one in the box's color 1px smaller over it, which covers the box's
   own border where they meet. */
.tooltip-box {
  --border-arrow: calc(var(--tooltip-arrow) + 1px);
  position: relative;
  display: block;
  max-inline-size: var(--tooltip-max-width);
  padding: var(--space-tooltip);
  border: 1px solid var(--color-tooltip-border);
  border-radius: var(--radius-tooltip);
  background-color: var(--color-tooltip-bg);
  color: var(--color-tooltip-text);
  font-family: var(--font-body);
  font-size: var(--font-size-small);
  font-style: normal;
  font-weight: normal;
  line-height: var(--line-height-tooltip);
  letter-spacing: normal;
  text-align: center;
  text-decoration: none;
  text-shadow: none;
  text-transform: none;
  text-wrap: balance;
  white-space: normal;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border: 0 solid transparent;
  }

  &::before {
    border-width: var(--border-arrow);
  }

  &::after {
    border-width: var(--tooltip-arrow);
  }
}

.top,
.bottom {
  &::before,
  &::after {
    inset-inline-start: var(--tooltip-arrow-at, 50%);
    translate: -50% 0;
  }
}

.left,
.right {
  &::before,
  &::after {
    inset-block-start: var(--tooltip-arrow-at, 50%);
    translate: 0 -50%;
  }
}

.top {
  &::before,
  &::after {
    inset-block-start: 100%;
    border-block-end-width: 0;
  }

  &::before {
    border-block-start-color: var(--color-tooltip-border);
  }

  &::after {
    border-block-start-color: var(--color-tooltip-bg);
  }
}

.bottom {
  &::before,
  &::after {
    inset-block-end: 100%;
    border-block-start-width: 0;
  }

  &::before {
    border-block-end-color: var(--color-tooltip-border);
  }

  &::after {
    border-block-end-color: var(--color-tooltip-bg);
  }
}

.left {
  &::before,
  &::after {
    inset-inline-start: 100%;
    border-inline-end-width: 0;
  }

  &::before {
    border-inline-start-color: var(--color-tooltip-border);
  }

  &::after {
    border-inline-start-color: var(--color-tooltip-bg);
  }
}

.right {
  &::before,
  &::after {
    inset-inline-end: 100%;
    border-inline-start-width: 0;
  }

  &::before {
    border-inline-end-color: var(--color-tooltip-border);
  }

  &::after {
    border-inline-end-color: var(--color-tooltip-bg);
  }
}
</style>
