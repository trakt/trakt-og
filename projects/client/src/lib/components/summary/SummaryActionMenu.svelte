<!--
  The small ••• tile under a `SummaryAction`'s +, opening a menu of its quieter actions (view history, rewatch,
  drop). Rows are links, or controls that style themselves as menu rows (`VisibilityControl variant="menu"`).
  `children` gets a function that closes the menu, for rows that open a popover of their own and finish later.
    <SummaryActionMenu>
      {#snippet children(close)}
        <a href="/users/me/history">View history</a>
        <VisibilityControl {target} action="drop" variant="menu" onsaving={close}>Drop show</VisibilityControl>
      {/snippet}
    </SummaryActionMenu>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import ellipsis from '$lib/icons/regular/ellipsis.svg?raw';

interface Props {
  children: Snippet<[() => void]>;
  label?: string;
}

const { children, label = 'More actions' }: Props = $props();
const id = $props.id();
let menu = $state<HTMLDivElement>();
let expanded = $state(false);

const toggle = (event: ToggleEvent & { currentTarget: HTMLElement }) => {
  expanded = event.newState === 'open';
  if (expanded) event.currentTarget.querySelector<HTMLElement>('a, button')?.focus();
};
const close = () => menu?.hidePopover();
</script>

<div class="more" style:anchor-name="--summary-menu-{id}">
  <Tooltip text={label} placement="right">
    {#snippet trigger(tip)}
      <button type="button" class="tile" popovertarget="summary-menu-{id}" aria-label={label} aria-haspopup="menu"
        aria-expanded={expanded} {...tip}><Icon svg={ellipsis} /></button>
    {/snippet}
  </Tooltip>
  <div bind:this={menu} id="summary-menu-{id}" class="menu" popover="auto" style:position-anchor="--summary-menu-{id}"
    ontoggle={toggle}>
    {@render children(close)}
  </div>
</div>

<style>
.more {
  flex: 1;
  display: flex;
}

.tile {
  flex: 1;
  display: grid;
  place-items: center;
  min-block-size: 0;
  margin: var(--tile-inset);
  padding: 0;
  border: 0;
  border-radius: var(--radius-summary-action);
  background: var(--tile-bg);
  color: var(--tile-color);
  font-size: var(--summary-action-menu-icon-size);
  cursor: pointer;
  transition: background-color var(--transition-summary-action);

  &:is(:hover, :focus-visible),
  .more:has(.menu:popover-open) & {
    background: var(--tile-hover-bg);
    filter: var(--tile-hover-filter);
  }

  &:focus-visible {
    outline: var(--watch-focus) solid var(--color-input-border-focus);
    outline-offset: calc(-1 * var(--watch-focus));
  }
}

.menu {
  position: fixed;
  position-area: bottom span-left;
  position-try-fallbacks: flip-block, flip-inline;
  inset: auto;
  inline-size: var(--summary-action-menu-width);
  margin: var(--summary-action-menu-gap) 0;
  padding: var(--space-sm-block) 0;
  border: 1px solid var(--color-dropdown-border);
  border-radius: var(--radius-summary-action);
  background: var(--color-box);
  color: var(--color-dropdown-text);
  box-shadow: var(--shadow-dropdown);
  font: var(--font-size-base) / var(--line-height-base) var(--font-body);
  text-align: start;
}

/* Link rows; controls in the menu draw the same row themselves. */
.menu > :global(a) {
  display: flex;
  align-items: center;
  gap: var(--summary-action-menu-row-gap);
  padding: var(--space-sm-block) var(--gutter);
  color: inherit;
  text-decoration: none;

  & > :global(.icon) {
    color: var(--color-text-muted);
    font-size: var(--font-size-summary-action-menu-icon);
  }
}

/* Whole-selector global: a nested `&:hover` gets this component's scope class, which the caller's link doesn't have. */
.menu > :global(a:is(:hover, :focus-visible)) {
  background: var(--color-dropdown-hover-bg);
  color: var(--color-dropdown-hover-text);
}

.menu > :global(hr) {
  margin: var(--space-sm-block) 0;
  border: 0;
  border-block-start: 1px solid var(--color-menu-divider);
}

@media (prefers-reduced-motion: reduce) {
  .tile {
    transition: none;
  }
}
</style>
