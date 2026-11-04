<!--
  A Dropdown row that opens a second menu beside it, for a group too long to list in place ("IMDb" opens Rating and
  Votes). The pointer opens it on hover and a tap toggles it; Enter, Space or the right arrow opens it and moves focus
  in, the left arrow comes back, and Esc closes the whole menu. One is open at a time. Its rows are the Dropdown's own
  (ul > li > a), `icon` goes before the row's name (a site's logo), and `current` turns the row red when one of them
  is picked.
    <Dropdown>
      {#snippet trigger()}IMDB Votes{/snippet}
      <ul>
        <DropdownFlyout label="IMDb" current>
          <ul><li><a href="...">Rating</a></li><li><a href="..." aria-current="true">Votes</a></li></ul>
        </DropdownFlyout>
      </ul>
    </Dropdown>
  It's a fixed panel placed beside the row, not a popover inside the menu's popover, which Safari misplaces.
-->
<script lang="ts">
import angleRight from '$lib/icons/regular/angle-right.svg?url';
import type { Snippet } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { flyoutPlacement } from './flyoutPlacement.ts';

interface Props {
  label: string;
  current?: boolean;
  icon?: Snippet;
  children: Snippet;
}

const { label, current = false, icon, children }: Props = $props();
const id = $props.id();
const OPENED = 'dropdown-flyout-open';
let open = $state(false);
let row = $state<HTMLButtonElement>();
let panel = $state<HTMLElement>();
let place = $state<{ top: number; left: number }>();

// Opening one closes the others, and closing the menu closes them all.
const sharedWithMenu: Attachment<HTMLElement> = (item) => {
  const menu = item.closest('[popover]');
  if (!menu) return;
  const opened = (event: Event) => {
    if (event instanceof CustomEvent && event.detail !== id) open = false;
  };
  const toggled = (event: Event) => {
    if (event instanceof ToggleEvent && event.newState === 'closed') open = false;
  };
  menu.addEventListener(OPENED, opened);
  menu.addEventListener('toggle', toggled);
  return () => {
    menu.removeEventListener(OPENED, opened);
    menu.removeEventListener('toggle', toggled);
  };
};

$effect(() => {
  if (!open || !row || !panel) return;
  row.closest('[popover]')?.dispatchEvent(new CustomEvent(OPENED, { detail: id }));
  const style = getComputedStyle(panel);
  place = flyoutPlacement({
    row: row.getBoundingClientRect(),
    flyout: { width: panel.offsetWidth, height: panel.offsetHeight },
    viewport: { width: innerWidth, height: innerHeight },
    inset: (parseFloat(style.paddingTop) || 0) + (parseFloat(style.borderTopWidth) || 0),
  });
});

const focusIn = () => {
  open = true;
  requestAnimationFrame(() => panel?.querySelector<HTMLElement>('a, button')?.focus());
};

function rowKey(event: KeyboardEvent) {
  if (!['ArrowRight', 'Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  focusIn();
}

function panelKey(event: KeyboardEvent) {
  if (event.key !== 'ArrowLeft') return;
  event.preventDefault();
  open = false;
  row?.focus();
}

const hover = (next: boolean) => (event: PointerEvent) => {
  if (event.pointerType === 'mouse') open = next;
};
</script>

<li class="flyout-item" onpointerenter={hover(true)} onpointerleave={hover(false)} {@attach sharedWithMenu}>
  <button bind:this={row} type="button" class={['flyout-row', { current }]} aria-expanded={open}
    aria-controls="flyout-{id}" style:--angle={`url("${angleRight}")`}
    onclick={(event) => (open = event instanceof PointerEvent && event.pointerType === 'mouse' ? true : !open)}
    onkeydown={rowKey}><span class="name">{@render icon?.()}{label}</span></button>
  <div bind:this={panel} id="flyout-{id}" class="flyout" hidden={!open} style:top={place && `${place.top}px`}
    style:left={place && `${place.left}px`} role="presentation" onkeydown={panelKey}>
    {@render children()}
  </div>
</li>

<style>
/* The chevron in the check's place, and the picked row's red when one of the flyout's rows is picked. */
.flyout-item > .flyout-row {
  &::after {
    mask-image: var(--angle);
    visibility: visible;
  }

  &[aria-expanded='true'] {
    background-color: var(--color-menu-row-hover);
    color: var(--color-menu-row-hover-text);
  }

  &.current {
    color: var(--brand-primary);
    font-weight: var(--font-weight-headings-heavy);
  }
}

.name {
  display: inline-flex;
  align-items: center;
  gap: var(--space-menu-icon);
}

/* The Dropdown's menu panel, beside the row. */
.flyout {
  position: fixed;
  min-inline-size: var(--menu-min-width);
  padding: var(--space-menu);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
  box-shadow: var(--shadow-menu);
}
</style>
