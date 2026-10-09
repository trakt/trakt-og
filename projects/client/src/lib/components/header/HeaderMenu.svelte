<!--
  A header dropdown: a trigger button and a popover menu under it, in the shared dropdown's card look (rounded,
  bordered, rows that soften on hover). Like OG it opens on mouse hover. Click, tap, Enter and Space open it too
  (show, not toggle, so the click after a hover doesn't shut it), and Esc, a click outside or the mouse leaving
  closes it (Popover API). The menu hangs from the trigger's end edge, or its start edge when there's no room
  (the profile menu), and the header styles the trigger's open look.
  Rows are ul > li > a (or button), with <hr> as the divider. `aria-current` marks the page you're on in bold
  white on red.
-->
<script lang="ts">
import { afterNavigate } from '$app/navigation';
import type { Snippet } from 'svelte';

interface Props {
  trigger: Snippet;
  children: Snippet;
  /** Names the trigger when its content doesn't (an icon-only button). */
  label?: string;
}

const { trigger, children, label }: Props = $props();
const id = $props.id();
let menu = $state<HTMLElement>();

// Mouse hover opens the menu like OG. Touch skips it, so a tap toggles the popover once instead of twice.
const openOnHover = (root: HTMLElement) => {
  const hover = (open: boolean) => (event: PointerEvent) => {
    if (event.pointerType === 'mouse') menu?.togglePopover(open);
  };
  const enter = hover(true);
  const leave = hover(false);
  root.addEventListener('pointerenter', enter);
  root.addEventListener('pointerleave', leave);
  return () => {
    root.removeEventListener('pointerenter', enter);
    root.removeEventListener('pointerleave', leave);
  };
};

// Client-side navigation keeps the page, so close the menu once a link in it has done its job.
afterNavigate(() => menu?.hidePopover());
</script>

<div class="header-menu" style:anchor-name="--menu-{id}" {@attach openOnHover}>
  <button type="button" class="trigger" popovertarget="menu-{id}" popovertargetaction="show"
    aria-label={label}>{@render trigger()}</button>
  <div bind:this={menu} id="menu-{id}" class="menu" popover="auto" style:position-anchor="--menu-{id}">
    {@render children()}
  </div>
</div>

<style>
.header-menu {
  position: relative;

  /* Bridges the gap above the menu, so the pointer crossing it doesn't count as leaving. */
  &:has(.menu:popover-open)::after {
    content: '';
    position: absolute;
    inset-block-start: 100%;
    inset-inline: 0;
    block-size: var(--space-menu-offset);
  }
}

.trigger {
  display: flex;
  align-items: center;
  min-block-size: 0;
  border: 0;
  background: none;
  color: var(--color-header-text);
  font: inherit;
  text-shadow: var(--text-shadow-headings);
  transition: background-color 0.25s, box-shadow 0.25s, color 0.25s;
}

/* As wide as its longest row, and never narrower than the trigger. */
.menu {
  position: fixed;
  position-area: bottom span-left;
  position-try-fallbacks: flip-inline;
  inset: auto;
  inline-size: max-content;
  min-inline-size: anchor-size(inline);
  max-block-size: calc(100dvh - var(--header-height));
  overflow-y: auto;
  margin: var(--space-menu-offset) 0 0;
  padding: var(--space-menu);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
  color: var(--color-dropdown-menu-text);
  font-family: var(--font-body);
  font-size: var(--font-size-menu);
  font-weight: normal;
  text-align: start;
  box-shadow: var(--shadow-menu);
}

.menu :global {
  & ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  & :is(a, button) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-menu-check);
    inline-size: 100%;
    min-block-size: 0;
    padding: var(--space-menu-row);
    border: 0;
    border-radius: var(--radius-menu-row);
    background: none;
    color: inherit;
    font: inherit;
    line-height: var(--line-height-base);
    text-align: start;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 0.25s, color 0.25s;

    &:is(:hover, :focus-visible) {
      background-color: var(--color-menu-row-hover);
      color: var(--color-menu-row-hover-text);
      outline: none;
    }

    /* The page you're on: white on red, hovered or not. */
    &[aria-current]:not([aria-current='false']) {
      background-color: var(--brand-primary);
      color: var(--color-text-inverse);
      font-weight: var(--font-weight-headings-heavy);
    }
  }

  & hr {
    margin: var(--space-menu) calc(var(--space-menu) * -1);
    border: 0;
    border-block-start: 1px solid var(--color-menu-border);
  }
}
</style>
