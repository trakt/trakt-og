<!--
  OG's pagination quick jump: the "…" between page numbers opens "Jump to page" with a select of every page, and
  picking one goes there. OG opened it on hover only; og also opens it on a click or Enter, so keyboard and touch
  get it too. It stays open while the select has focus, and Esc or a click elsewhere closes it.
    <PageJump total={319} current={1} href={(n) => `?page=${n}`} />
-->
<script lang="ts">
import { goto } from '$app/navigation';
import Caret from '$lib/components/dropdown/Caret.svelte';
import Icon from '$lib/icons/Icon.svelte';
import ellipse from '$lib/icons/trakt/ellipse.svg?raw';

interface Props {
  total: number;
  current: number;
  href: (page: number) => string;
}

const { total, current, href }: Props = $props();
const id = $props.id();
// Long enough to move the pointer across the gap from the dots onto the panel.
const leaveDelay = 100;

let button = $state<HTMLButtonElement>();
let panel = $state<HTMLElement>();
let open = $state(false);
let leaving: ReturnType<typeof setTimeout> | undefined;

const show = (event: PointerEvent) => {
  clearTimeout(leaving);
  if (event.pointerType === 'touch' || panel?.matches(':popover-open')) return;
  panel?.showPopover({ source: button });
};

const hide = () => {
  clearTimeout(leaving);
  leaving = setTimeout(() => {
    const hovered = button?.matches(':hover') || panel?.matches(':hover');
    if (!hovered && !panel?.contains(document.activeElement)) panel?.hidePopover();
  }, leaveDelay);
};

// A click opens it, or, already open from hovering, moves into the select, like OG focused it on show.
const click = () => {
  if (!panel?.matches(':popover-open')) panel?.showPopover({ source: button });
  panel?.querySelector('select')?.focus();
};

const jump = (event: Event & { currentTarget: HTMLSelectElement }) => {
  const page = Number(event.currentTarget.value);
  if (!page) return;
  panel?.hidePopover();
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- href already resolves the current path
  void goto(href(page));
};
</script>

<button
  bind:this={button}
  type="button"
  class="gap"
  aria-label="Jump to page"
  aria-haspopup="dialog"
  aria-controls="page-jump-{id}"
  aria-expanded={open}
  style:anchor-name="--page-jump-{id}"
  onpointerenter={show}
  onpointerleave={hide}
  onclick={click}
>
  <Icon svg={ellipse} />
</button>
<div
  bind:this={panel}
  id="page-jump-{id}"
  class="panel"
  popover="auto"
  role="dialog"
  aria-label="Jump to page"
  tabindex="-1"
  style:position-anchor="--page-jump-{id}"
  ontoggle={(event) => (open = event.newState === 'open')}
  onpointerenter={() => clearTimeout(leaving)}
  onpointerleave={hide}
>
  <label for="page-jump-{id}-select" class="title">Jump to page</label>
  <span class="field">
    <select id="page-jump-{id}-select" onchange={jump}>
      <option value=""></option>
      {#each { length: total }, i (i)}
        <option value={i + 1} disabled={i + 1 === current}>{(i + 1).toLocaleString('en-US')}</option>
      {/each}
    </select>
    <Caret />
  </span>
  <span class="note">of {total.toLocaleString('en-US')}</span>
</div>

<style>
.gap {
  display: inline-grid;
  place-items: center;
  min-inline-size: var(--pagination-size);
  block-size: var(--pagination-size);
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background: none;
  color: var(--color-control-muted);
  font-size: var(--font-size-pagination-gap);
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover,
  &[aria-expanded='true'] {
    background-color: var(--color-tool-hover-bg);
    color: var(--color-pagination-text);
  }
}

/* The menu panel under the dots: a small upper-case label over a page picker, and the page count beside it. */
.panel {
  position: fixed;
  position-area: block-end center;
  inset: auto;
  margin: var(--space-menu-offset) 0 0;
  padding: var(--space-filter-popover);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
  color: var(--color-dropdown-menu-text);
  box-shadow: var(--shadow-menu);
  font-family: var(--font-body);
  font-size: var(--font-size-menu);

  &:popover-open {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    gap: var(--space-page-jump-title) var(--space-filter-popover);
  }
}

.title {
  grid-column: 1 / -1;
  color: var(--color-menu-header);
  font-family: var(--font-headings);
  font-size: var(--font-size-filter-popover-title);
  font-weight: var(--font-weight-headings-heavy);
  letter-spacing: var(--letter-spacing-menu-header);
  text-transform: uppercase;
}

.field {
  position: relative;
  display: inline-flex;
  align-items: center;

  & :global(.caret) {
    position: absolute;
    inset-inline-end: var(--space-control-inline);
    pointer-events: none;
  }
}

select {
  block-size: var(--control-height);
  padding: 0 calc(var(--space-control-inline) * 2 + var(--font-size-caret)) 0 var(--space-control-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-raised-bg);
  color: var(--color-control-text);
  font: inherit;
  font-variant-numeric: tabular-nums;
  appearance: none;
  cursor: pointer;

  &:hover {
    border-color: var(--color-control-border-hover);
  }

  &:focus-visible {
    border-color: var(--color-control-border-hover);
    outline: none;
  }
}

.note {
  color: var(--color-control-muted);
  white-space: nowrap;
}
</style>
