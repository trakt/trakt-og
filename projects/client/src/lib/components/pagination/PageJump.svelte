<!--
  OG's pagination quick jump: the "…" between page numbers opens "Jump to page" with a select of every page, and
  picking one goes there. OG opened it on hover only; og also opens it on a click or Enter, so keyboard and touch
  get it too. It stays open while the select has focus, and Esc or a click elsewhere closes it.
    <PageJump total={319} current={1} href={(n) => `?page=${n}`} />
-->
<script lang="ts">
import { goto } from '$app/navigation';
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
  <label>
    Jump to page
    <select onchange={jump}>
      <option value=""></option>
      {#each { length: total }, i (i)}
        <option value={i + 1} disabled={i + 1 === current}>{i + 1}</option>
      {/each}
    </select>
  </label>
</div>

<style>
.gap {
  display: flex;
  align-items: center;
  min-block-size: 0;
  margin-inline-start: -1px;
  padding: 0 var(--space-base-inline);
  border: 0;
  background: none;
  color: var(--color-pagination-text);
  font-size: var(--font-size-icon-lg);
  line-height: 1;
  cursor: pointer;

  &:hover,
  &[aria-expanded='true'] {
    color: var(--brand-primary);
  }
}

/* OG's Bootstrap popover under the dots: a white box with the title and select on one line. */
.panel {
  position: fixed;
  position-area: block-end center;
  inset: auto;
  margin: var(--space-page-jump-offset) 0 0;
  padding: var(--space-page-jump);
  border: 1px solid var(--color-dropdown-border);
  border-radius: var(--radius-base);
  background-color: var(--color-box);
  color: var(--color-text);
  box-shadow: var(--shadow-dropdown);
  font-family: var(--font-headings);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-headings);
}

label {
  display: flex;
  align-items: center;
  gap: var(--space-sm-inline);
  white-space: nowrap;
}

select {
  min-inline-size: var(--page-jump-select-width);
  font: inherit;
}
</style>
