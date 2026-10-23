<!--
  The small ••• tile under a `SummaryAction`'s +, opening a menu of its quieter actions (view history, rewatch,
  drop). Rows are links, or controls that style themselves as menu rows (`VisibilityControl variant="menu"`).
  `children` gets a function that closes the menu, for rows that open a popover of their own and finish later.
  `trigger` swaps the tile for the caller's own button (a quick-icon bar's •••), spread with the menu's attributes.
    <SummaryActionMenu>
      {#snippet children(close)}
        <a href="/users/me/history">View history</a>
        <VisibilityControl {target} action="drop" variant="menu" onsaving={close}>Drop show</VisibilityControl>
      {/snippet}
    </SummaryActionMenu>
-->
<script lang="ts">
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import ellipsis from '$lib/icons/regular/ellipsis.svg?raw';

interface Props {
  children: Snippet<[() => void]>;
  label?: string;
  /** The caller's own button in place of the tile. Spread `attrs` on it: they open the menu and carry the tooltip. */
  trigger?: Snippet<[HTMLButtonAttributes]>;
  placement?: 'right' | 'bottom';
}

const { children, label = 'More actions', trigger: custom, placement = 'right' }: Props = $props();
const id = $props.id();
let menu = $state<HTMLDivElement>();
let expanded = $state(false);
let opened = $state(false);

const toggle = (event: ToggleEvent & { currentTarget: HTMLElement }) => {
  expanded = event.newState === 'open';
  if (expanded) event.currentTarget.querySelector<HTMLElement>('a, button')?.focus();
};
const close = () => menu?.hidePopover();
</script>

<div class={['more', { custom }]} style:anchor-name="--summary-menu-{id}">
  <Tooltip text={label} {placement}>
    {#snippet trigger(tip)}
      {@const attrs = {
      popovertarget: `summary-menu-${id}`,
      'aria-label': label,
      'aria-haspopup': 'menu' as const,
      'aria-expanded': expanded,
      ...tip,
    }}
      {#if custom}{@render custom(attrs)}{:else}<button type="button" class="tile" {...attrs}><Icon
            svg={ellipsis}
          /></button>{/if}
    {/snippet}
  </Tooltip>
  <div bind:this={menu} id="summary-menu-{id}" class="menu" popover="auto" style:position-anchor="--summary-menu-{id}"
    onbeforetoggle={(event) => { if (event.newState === 'open') opened = true; }} ontoggle={toggle}>
    {#if opened}{@render children(close)}{/if}
  </div>
</div>

<style>
.more {
  display: flex;

  &:not(.custom) {
    flex: 1;
  }
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

/* The dropdown menus' surface: their border, corners, padding and shadow. */
.menu {
  position: fixed;
  position-area: bottom span-left;
  position-try-fallbacks: flip-block, flip-inline;
  inset: auto;
  min-inline-size: var(--menu-min-width);
  margin: var(--space-menu-offset) 0;
  padding: var(--space-menu);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
  color: var(--color-dropdown-menu-text);
  box-shadow: var(--shadow-menu);
  font: normal var(--font-size-menu) / var(--line-height-base) var(--font-body);
  text-align: start;
}

/* Link and button rows, as a dropdown's; controls in the menu draw the same row themselves. */
.menu > :global(:is(a, button)) {
  display: flex;
  align-items: center;
  gap: var(--summary-action-menu-row-gap);
  inline-size: 100%;
  min-block-size: 0;
  padding: var(--space-menu-row);
  border: 0;
  border-radius: var(--radius-menu-row);
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;

  & > :global(.icon) {
    color: var(--color-text-muted);
    font-size: var(--font-size-summary-action-menu-icon);
  }
}

/* Whole-selector global: a nested `&:hover` gets this component's scope class, which the caller's link doesn't have. */
.menu > :global(:is(a, button):is(:hover, :focus-visible)) {
  background-color: var(--color-menu-row-hover);
  color: var(--color-menu-row-hover-text);
  outline: none;
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
