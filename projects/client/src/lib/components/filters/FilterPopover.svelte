<!--
  A toolbar icon tool that opens a small panel in the dropdown menu's style: the title search and the streaming
  filter. The panel has a small upper-case title over a line of help, the fields, then a footer with a Clear button
  that drops the filter, an optional note, and Apply. Clear and Apply both close it. The icon turns red while
  `active`. `placeholder` keeps it shut, with the tooltip saying why. Focus moves to the first field on open and
  back to the icon on close, and `show()` opens it from a keyboard shortcut. A `kbd` in a `.panel-field` shows a
  shortcut at the field's end.
    <FilterPopover svg={search} label="Filter by title" tooltip="Filter by Title" title="Search terms"
      help="Only display items with a title matching your search term." active={Boolean(terms)}
      clearable={Boolean(terms)} onapply={apply} onclear={clear}>
      <label class="panel-field"><input type="search" bind:value={draft} /><kbd>T</kbd></label>
    </FilterPopover>
-->
<script lang="ts">
import Caret from '$lib/components/dropdown/Caret.svelte';
import Tooltip from '$lib/components/tooltip/Tooltip.svelte';
import Icon from '$lib/icons/Icon.svelte';
import xmark from '$lib/icons/regular/xmark.svg?raw';
import type { Snippet } from 'svelte';

interface Props {
  svg: string;
  /** Names the icon button and the panel. */
  label: string;
  tooltip: string;
  active?: boolean;
  placeholder?: boolean;
  /** The panel's heading and the help line under it. */
  title: string;
  help: string;
  /** Between the × and Apply: a count or a tip. */
  note?: string;
  /** Something is set, so the × has something to clear. */
  clearable?: boolean;
  /** Which way the panel opens from the icon: `end` (the default) for the toolbar's right side. */
  align?: 'start' | 'end';
  /** Runs as the panel opens, before focus moves in. */
  onopen?: () => void;
  onapply: () => void;
  onclear: () => void;
  children: Snippet;
}

const {
  svg,
  label,
  tooltip,
  active = false,
  placeholder = false,
  title,
  help,
  note,
  clearable = false,
  align = 'end',
  onopen,
  onapply,
  onclear,
  children,
}: Props = $props();
const id = $props.id();
let button = $state<HTMLButtonElement>();
let panel = $state<HTMLDivElement>();

export function show() {
  if (!placeholder) panel?.showPopover();
}

const close = () => panel?.hidePopover();

function submit(event: SubmitEvent) {
  event.preventDefault();
  onapply();
  close();
}

function clear() {
  onclear();
  close();
}

function toggle(event: ToggleEvent) {
  if (event.newState !== 'open') {
    button?.focus({ preventScroll: true });
    return;
  }
  onopen?.();
  panel?.querySelector<HTMLElement>('input, button')?.focus();
}
</script>

<span class="filter-popover" style:anchor-name="--filter-popover-{id}">
  <Tooltip text={tooltip}>
    {#snippet trigger(attributes)}
      <button bind:this={button} type="button" class={['launcher', { active, placeholder }]} aria-label={label}
        aria-haspopup="dialog" aria-disabled={placeholder}
        popovertarget={placeholder ? undefined : `filter-popover-${id}`} {...attributes}>
        <Icon {svg} /><Caret />
      </button>
    {/snippet}
  </Tooltip>
  <div bind:this={panel} id="filter-popover-{id}" class={['panel', align]} popover="auto" role="dialog"
    aria-labelledby="filter-popover-{id}-title"
    style:position-anchor="--filter-popover-{id}" ontoggle={toggle}>
    <form onsubmit={submit}>
      <h2 class="title" id="filter-popover-{id}-title">{title}</h2>
      <p class="help">{help}</p>
      {@render children()}
      <div class="foot">
        <button type="button" class="clear" disabled={!clearable} onclick={clear}><Icon svg={xmark} />Clear</button>
        {#if note}<span class="note">{note}</span>{/if}
        <button type="submit" class="apply">Apply</button>
      </div>
    </form>
  </div>
</span>

<style>
.filter-popover {
  display: inline-flex;
}

.launcher {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-tool-caret);
  min-inline-size: var(--tool-size);
  min-block-size: var(--tool-size);
  padding: 0 var(--space-tool-inline);
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-tool);
  font-size: var(--font-size-tool);
  line-height: 1;
  vertical-align: middle;
  transition: color 0.5s, background-color 0.2s;

  &:is(:hover, :focus-visible),
  .filter-popover:has(.panel:popover-open) & {
    background-color: var(--color-tool-hover-bg);
    color: var(--color-tool-hover);
    --caret-color: currentcolor;
  }

  &.active {
    color: var(--brand-primary);
    --caret-color: var(--brand-primary);
  }

  &.placeholder {
    cursor: not-allowed;
  }
}

.panel {
  position: fixed;
  position-area: bottom span-left;
  position-try-fallbacks: flip-inline;

  &.start {
    position-area: bottom span-right;
  }

  inset: auto;
  inline-size: var(--filter-popover-width);
  margin: var(--space-menu-offset) 0 0;
  padding: var(--space-filter-popover);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
  color: var(--color-dropdown-menu-text);
  box-shadow: var(--shadow-menu);
  font-family: var(--font-body);
  font-size: var(--font-size-menu);
  font-weight: normal;
  line-height: var(--line-height-base);
  text-align: start;
  text-transform: none;
}

.title {
  margin: 0 0 var(--space-filter-popover-title);
  color: var(--color-menu-header);
  font-family: var(--font-headings);
  font-size: var(--font-size-filter-popover-title);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-menu-header);
  line-height: var(--line-height-base);
  text-transform: uppercase;
}

.help {
  margin: 0 0 var(--space-filter-popover);
  color: var(--color-control-text);
  font-size: var(--font-size-filter-popover-help);
  line-height: var(--line-height-filter-popover-help);
  text-wrap: balance;
}

.foot {
  display: flex;
  align-items: center;
  gap: var(--space-filter-popover);
  margin: var(--space-filter-popover) calc(var(--space-filter-popover) * -1) calc(var(--space-filter-popover) * -1);
  padding: var(--space-filter-popover);
  border-block-start: 1px solid var(--color-menu-border);
}

.clear {
  display: inline-flex;
  align-items: center;
  gap: var(--space-control-caret);
  min-block-size: var(--control-height);
  padding: 0 var(--space-control-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-raised-bg);
  color: var(--color-control-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-control);
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;

  & :global(.icon) {
    font-size: var(--font-size-tool-icon-small);
  }

  &:is(:hover, :focus-visible):not(:disabled) {
    border-color: var(--brand-primary);
    background-color: var(--color-control-raised-hover-bg);
    color: var(--brand-primary);
  }

  &:disabled {
    opacity: var(--opacity-action-disabled);
    cursor: default;
  }
}

.note {
  overflow: hidden;
  color: var(--color-control-muted);
  font-size: var(--font-size-filter-popover-help);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.apply {
  min-block-size: var(--control-height);
  margin-inline-start: auto;
  padding: 0 var(--space-filter-popover-apply);
  border: 0;
  border-radius: var(--radius-control);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings-heavy);

  &:is(:hover, :focus-visible) {
    background-color: var(--brand-primary-darken);
  }
}

/* A search field with its icon inside, for whatever opens in the panel. */
.panel :global {
  & .panel-field {
    position: relative;
    display: block;

    & > .icon {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: var(--space-control-inline);
      translate: 0 -50%;
      color: var(--color-control-muted);
      font-size: var(--font-size-tool-icon-small);
      pointer-events: none;
    }
  }

  & input:is([type='search'], [type='datetime-local']) {
    inline-size: 100%;
    block-size: var(--control-height);
    padding: 0 var(--space-control-inline);
    border: 1px solid var(--color-control-border);
    border-radius: var(--radius-control);
    background-color: var(--color-control-bg);
    color: var(--color-control-text);
    font: inherit;

    &:focus-visible {
      border-color: var(--color-control-border-hover);
      outline: none;
    }
  }

  & .panel-field > input {
    padding-inline-start: var(--space-filter-popover-field-icon);
  }

  /* A shortcut key cap at the field's end, like the header search's "/". */
  & .panel-field > kbd {
    position: absolute;
    inset-block: 0;
    inset-inline-end: var(--space-stat);
    display: inline-grid;
    place-items: center;
    min-inline-size: var(--search-kbd-size);
    block-size: var(--search-kbd-size);
    margin-block: auto;
    padding-inline: var(--space-xs-inline);
    border-radius: var(--radius-search-kbd);
    background: var(--color-search-kbd-bg);
    color: var(--color-control-muted);
    font-family: inherit;
    font-size: var(--font-size-small);
    font-weight: var(--font-weight-headings);
    line-height: 1;
    pointer-events: none;
  }

  & .panel-field:has(kbd) input {
    padding-inline-end: calc(var(--search-kbd-size) + var(--space-control-inline));
  }
}
</style>
