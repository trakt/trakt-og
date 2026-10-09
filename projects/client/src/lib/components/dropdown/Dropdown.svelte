<!--
  OG's dropdown: a default button with a caret, and a menu that drops from its bottom-left corner (Popover API).
  Click, Enter or Space opens it and focus moves to the first item. Esc or a click outside closes it and puts
  focus back on the button, and picking an item closes it too.
    <Dropdown>
      {#snippet trigger()}Watched Date{/snippet}
      <ul>
        <li><a href="..." aria-current="true">Watched Date</a></li>
        <li><a href="...">Title</a></li>
      </ul>
      <hr />
    </Dropdown>
  Rows are ul > li > a (or button). `aria-current` marks the picked one in bold red with a check on the right, as
  does `aria-pressed="true"` on a toggle row. <hr> divides, and an li.header labels a group ("TYPES"). When the
  picked row sits under a header, pass that header as `section` and the trigger names it first ("Reactions: All
  Comments"). An <em> in the trigger or a row is OG's gray note ("(Pending)").
  `variant="circle"` is the round translucent icon button with no caret that OG put after a profile name.
  `variant="icon"` is a toolbar icon tool with a caret, like the filter eye: a square that fills on hover. `variant="transparent"` is OG's
  `.btn-transparent`: the default button's size and caret with no fill, for dark bands (discover's Recent Comments).
  `variant="title"` is a page title that picks the page, like the calendar's: pass an `.eyebrow` ("My") and a `.name`
  ("Shows & Movies") as the trigger, and the caret sits right after the name. `block` stretches the trigger to its
  container, with the caret at the far end.
-->
<script lang="ts">
import checkThick from '$lib/icons/trakt/check-thick.svg?url';
import type { Snippet } from 'svelte';
import Caret from './Caret.svelte';

interface Props {
  trigger: Snippet;
  children: Snippet;
  /** Names the trigger when its content doesn't (an icon-only button). */
  label?: string;
  /** The header the picked row sits under, named before the trigger's text. */
  section?: string;
  /** A joined SortDirection follows: square off the end corners. */
  joined?: boolean;
  /** Fill the container's width, the caret at the far end (a sidebar's full-width fields). */
  block?: boolean;
  /** A checklist: picking a row keeps the menu open, and opening it focuses its search field first. */
  multiple?: boolean;
  variant?: 'default' | 'circle' | 'icon' | 'transparent' | 'title';
}

const { trigger, children, label, section, joined = false, block = false, multiple = false, variant = 'default' }:
  Props = $props();
const id = $props.id();

const focusFirstItem = (event: ToggleEvent & { currentTarget: HTMLElement }) => {
  if (event.newState !== 'open') return;
  event.currentTarget.querySelector<HTMLElement>(multiple ? 'input, a, button' : 'a, button')?.focus();
};

const closeOnPick = (event: MouseEvent & { currentTarget: HTMLElement }) => {
  if (multiple) return;
  if (!(event.target instanceof Element) || !event.target.closest('a, button')) return;
  event.currentTarget.hidePopover();
};
</script>

<div class={['dropdown', { block }]} style:anchor-name="--dropdown-{id}">
  <button type="button" class={['trigger', variant, { joined, block }]} popovertarget="dropdown-{id}"
    aria-label={label}>
    {#if block}
      <span class="value">{#if section}<span class="section">{section}:</span>{/if}{@render trigger()}</span>
    {:else}
      {#if section}<span class="section">{section}:</span>{/if}
      {@render trigger()}
    {/if}
    {#if variant !== 'circle'}<Caret />{/if}
  </button>
  <div
    id="dropdown-{id}"
    class="menu"
    popover="auto"
    style:position-anchor="--dropdown-{id}"
    style:--check={`url("${checkThick}")`}
    ontoggle={focusFirstItem}
    onclick={closeOnPick}
    role="presentation"
  >
    {@render children()}
  </div>
</div>

<style>
.dropdown {
  display: inline-block;

  &.block {
    display: block;
    min-inline-size: 0;
  }
}

.trigger.block {
  inline-size: 100%;
  justify-content: space-between;

  /* The label and value share the space left of the caret, cut short when they run long. */
  & > .value {
    flex: 1;
    min-inline-size: 0;
    overflow: hidden;
    text-align: start;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & .section {
    margin-inline-end: var(--space-control-section);
  }
}

.trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-control-caret);
  white-space: nowrap;

  &:hover,
  .dropdown:has(.menu:popover-open) & {
    --caret-color: currentcolor;
  }

  & :global(em) {
    color: var(--color-dropdown-note);
  }
}

.section {
  margin-inline-end: calc(var(--space-control-section) - var(--space-control-caret));
  color: var(--color-control-muted);
  font-weight: normal;
}

.default {
  min-block-size: var(--control-height);
  padding: 0 calc(var(--space-control-inline) - 2px) 0 var(--space-control-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-control);
  line-height: 1;

  transition: background-color 0.2s, border-color 0.2s;

  &:hover,
  .dropdown:has(.menu:popover-open) & {
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
  }
}

.title {
  display: grid;
  grid-template-columns: minmax(0, auto) auto;
  justify-content: start;
  align-items: center;
  column-gap: var(--space-base-block);
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-frame-text);
  line-height: 1.15;
  text-align: start;

  & :global(.eyebrow) {
    grid-column: 1 / -1;
    color: var(--color-sidebar-label);
    font-size: var(--font-size-sidebar-eyebrow);
    font-weight: var(--font-weight-menu-header);
    letter-spacing: var(--letter-spacing-sidebar-label);
    text-transform: uppercase;
  }

  & :global(.name) {
    overflow: hidden;
    font-size: var(--font-size-sidebar-title);
    font-weight: var(--font-weight-headings-heavy);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* On the name's line, centered on its lowercase letters. */
  & :global(.caret) {
    translate: 0 2px;
  }

  &:hover,
  .dropdown:has(.menu:popover-open) & {
    --caret-color: var(--color-frame-text);
  }
}

.joined {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}

.circle {
  inline-size: 28px;
  min-block-size: 0;
  block-size: 28px;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background-color: var(--color-btn-circle-bg);
  color: var(--color-text-inverse);
  font-size: var(--font-size-btn-circle);
  line-height: 1;
  vertical-align: middle;
  transition: all 0.5s;

  &:hover,
  .dropdown:has(.menu:popover-open) & {
    background-color: var(--color-btn-circle-bg-hover);
  }
}

.icon {
  gap: var(--space-tool-caret);
  min-block-size: var(--tool-size);
  padding: 0 var(--space-tool-inline);
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: inherit;
  line-height: 1;

  &:hover,
  .dropdown:has(.menu:popover-open) & {
    background-color: var(--color-tool-hover-bg);
  }
}

.transparent {
  border-color: var(--color-dropdown-transparent-border);
  background: none;
  color: var(--color-dropdown-transparent-text);

  &:hover,
  .dropdown:has(.menu:popover-open) & {
    color: var(--color-dropdown-transparent-hover);
  }
}

.menu {
  position: fixed;
  position-area: bottom span-right;
  position-try-fallbacks: flip-inline;
  inset: auto;
  min-inline-size: var(--menu-min-width);
  max-block-size: calc(100dvh - var(--gutter));
  overflow-y: auto;
  margin: var(--space-menu-offset) 0 0;
  padding: var(--space-menu);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
  color: var(--color-dropdown-menu-text);
  /* It inherits from where it's placed, which can be a heading. */
  font-family: var(--font-body);
  font-size: var(--font-size-menu);
  font-weight: normal;
  letter-spacing: normal;
  text-align: start;
  text-shadow: none;
  text-transform: none;
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

    &:is(:hover, :focus-visible) {
      background-color: var(--color-menu-row-hover);
      color: var(--color-menu-row-hover-text);
      outline: none;
    }

    /* The thick Trakt check, on the right of the picked row. */
    &::after {
      content: '';
      flex: none;
      inline-size: var(--font-size-menu-check);
      block-size: var(--font-size-menu-check);
      background-color: currentcolor;
      mask: var(--check) center / contain no-repeat;
      visibility: hidden;
    }

    &:is([aria-current]:not([aria-current='false']), [aria-pressed='true']) {
      color: var(--brand-primary);
      font-weight: var(--font-weight-headings-heavy);

      &::after {
        visibility: visible;
      }
    }
  }

  & em {
    color: var(--color-dropdown-note);
  }

  & .header {
    padding: var(--space-menu-header);
    color: var(--color-menu-header);
    font-size: var(--font-size-menu-header);
    font-weight: var(--font-weight-menu-header);
    letter-spacing: var(--letter-spacing-menu-header);
    text-transform: uppercase;

    &:first-child {
      padding-block-start: var(--space-menu-offset);
    }
  }

  & hr {
    margin: var(--space-menu) calc(var(--space-menu) * -1);
    border: 0;
    border-block-start: 1px solid var(--color-menu-border);
  }
}
</style>
