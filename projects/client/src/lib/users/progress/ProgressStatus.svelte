<!--
  The status control after a progress row's title, drawn like the app's dropdowns: a dot in the status color and
  where you are with the show (Not started, Watching, Rewatching since…, Caught up, Dropped…). Its menu lists the status, picked,
  with its dot, then the row's show actions with their icons: Rewatch (Start over again and Undo rewatching while
  rewatching) and Drop, or Undrop on Dropped. Those rows are the shared visibility controls, so each still asks for its date or a yes, and the
  menu stays open until it saves. `onremove` gets a drop, restore or undone rewatch (on Rewatching) as it starts
  saving, since those take the row off the tab.
    <ProgressStatus {row} type="watched" onremove={remove} />
-->
<script lang="ts">
import Caret from '$lib/components/dropdown/Caret.svelte';
import VisibilityControl from '$lib/components/visibility/VisibilityControl.svelte';
import Icon from '$lib/icons/Icon.svelte';
import arrowRotateLeft from '$lib/icons/light/arrow-rotate-left.svg?raw';
import backward from '$lib/icons/light/backward.svg?raw';
import circleMinus from '$lib/icons/light/circle-minus.svg?raw';
import checkThick from '$lib/icons/trakt/check-thick.svg?url';
import type { ProgressType } from './progressTypes.ts';
import type { ProgressRow } from './toProgressRow.ts';

interface Props {
  row: ProgressRow;
  type: ProgressType;
  /** A drop or restore started saving, with whether it went through. */
  onremove?: (saved: Promise<boolean>) => void;
}

const { row, type, onremove }: Props = $props();
const id = $props.id();
let menu = $state<HTMLDivElement>();
let expanded = $state(false);

const target = $derived({ type: 'show' as const, id: row.id, title: row.title });
const status = $derived.by(() => {
  if (type === 'dropped') return { tone: 'dropped', text: row.droppedOn ? `Dropped ${row.droppedOn}` : 'Dropped' };
  if (row.rewatchingSince) return { tone: 'rewatching', text: `Rewatching since ${row.rewatchingSince}` };
  // A list's progress shows every show on it, including ones with no plays yet.
  if (row.plays === 0) return { tone: 'not-started', text: 'Not started' };
  return row.left === 0 ? { tone: 'done', text: 'Caught up' } : { tone: 'watching', text: 'Watching' };
});

const close = () => menu?.hidePopover();
const removing = (saved: Promise<boolean>) => {
  close();
  onremove?.(saved);
};

function toggle(event: ToggleEvent & { currentTarget: HTMLElement }) {
  expanded = event.newState === 'open';
  if (expanded) event.currentTarget.querySelector<HTMLElement>('button')?.focus();
}
</script>

<span class="status-control" style:anchor-name="--progress-status-{id}">
  <button type="button" class={['trigger', status.tone]} popovertarget="progress-status-{id}" aria-haspopup="menu"
    aria-expanded={expanded} aria-label="{status.text}: show actions for {row.title}">
    <span class="dot" aria-hidden="true"></span>{status.text}<Caret />
  </button>
  <div bind:this={menu} id="progress-status-{id}" class="menu" popover="auto"
    style:position-anchor="--progress-status-{id}" style:--check={`url("${checkThick}")`} ontoggle={toggle}>
    <ul>
      <li>
        <span class={['row', 'current', status.tone]} aria-current="true">
          <span class="label"><span class="dot" aria-hidden="true"></span>{status.text}</span>
        </span>
      </li>
      {#if type === 'dropped'}
        <li>
          <VisibilityControl {target} action="restore" variant="menu" onsaving={removing}>
            <span class="label"><Icon svg={arrowRotateLeft} fixedWidth />Undrop</span>
          </VisibilityControl>
        </li>
      {:else}
        {#if status.tone !== 'not-started'}
          <li>
            <VisibilityControl {target} action="rewatch" variant="menu" onsaving={close}>
              <span class="label"><Icon svg={backward} fixedWidth />{row.rewatchingSince
                ? 'Start over again'
                : 'Rewatch'}</span>
            </VisibilityControl>
          </li>
        {/if}
        {#if row.rewatchingSince}
          <li>
            <VisibilityControl {target} action="unrewatch" variant="menu"
              onsaving={type === 'rewatching' ? removing : close}>
              <span class="label"><Icon svg={arrowRotateLeft} fixedWidth />Undo rewatching</span>
            </VisibilityControl>
          </li>
        {/if}
        <li>
          <VisibilityControl {target} action="drop" variant="menu" onsaving={removing}>
            <span class="label"><Icon svg={circleMinus} fixedWidth />Drop</span>
          </VisibilityControl>
        </li>
      {/if}
    </ul>
  </div>
</span>

<style>
.status-control {
  display: inline-flex;
  flex: none;
}

/* The dropdown's default trigger. */
.trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-control-caret);
  min-block-size: var(--control-height);
  padding: 0 calc(var(--space-control-inline) - 2px) 0 var(--space-control-inline);
  border: 1px solid var(--color-control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-control-bg);
  color: var(--color-control-text);
  font-family: var(--font-body);
  font-size: var(--font-size-control);
  font-weight: var(--font-weight-control);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;

  &:hover,
  .status-control:has(.menu:popover-open) & {
    --caret-color: currentcolor;
    border-color: var(--color-control-border-hover);
    background-color: var(--color-control-hover-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
  }

}

.watching {
  --dot: var(--color-progress-episode-done);
}

.rewatching {
  --dot: var(--color-progress-watched);
}

.done {
  --dot: var(--color-text-muted);
}

.dropped {
  --dot: var(--brand-primary);
}

/* Nothing watched yet: an empty ring. */
.not-started .dot {
  background: none;
  box-shadow: inset 0 0 0 var(--progress-status-ring) var(--color-text-muted);
}

.dot {
  inline-size: var(--progress-status-dot);
  block-size: var(--progress-status-dot);
  margin-inline-end: var(--progress-status-dot-gap);
  border-radius: 50%;
  background: var(--dot);
}

/* The dropdown's menu. */
.menu {
  position: fixed;
  position-area: bottom span-right;
  position-try-fallbacks: flip-inline, flip-block;
  inset: auto;
  min-inline-size: var(--menu-min-width);
  margin: var(--space-menu-offset) 0 0;
  padding: var(--space-menu);
  border: 1px solid var(--color-menu-border);
  border-radius: var(--radius-menu);
  background-color: var(--color-menu-bg);
  color: var(--color-dropdown-menu-text);
  font-family: var(--font-body);
  font-size: var(--font-size-menu);
  text-align: start;
  box-shadow: var(--shadow-menu);
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* A row's icon, or the picked status's dot, before its label. */
.label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-menu-icon);
}

/* The dot centered in an icon's fixed width, so every label lines up. */
.label .dot {
  margin-inline: calc((1.25em - var(--progress-status-dot)) / 2);
}

/* The picked row and the visibility controls, as the dropdown's rows. */
.row,
.menu :global(.visibility-trigger.menu) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-menu-check);
  inline-size: 100%;
  padding: var(--space-menu-row);
  border-radius: var(--radius-menu-row);
  color: inherit;
  font: inherit;
  line-height: var(--line-height-base);
  white-space: nowrap;
}

.menu :global(.visibility-trigger.menu:is(:hover, :focus-visible)) {
  background-color: var(--color-menu-row-hover);
  color: var(--color-menu-row-hover-text);
  outline: none;
}

/* The thick Trakt check, on the right of the picked row. */
.current {
  color: var(--brand-primary);
  font-weight: var(--font-weight-headings-heavy);

  &::after {
    content: '';
    flex: none;
    inline-size: var(--font-size-menu-check);
    block-size: var(--font-size-menu-check);
    background-color: currentcolor;
    mask: var(--check) center / contain no-repeat;
  }
}

@media (prefers-reduced-motion: reduce) {
  .trigger {
    transition: none;
  }
}
</style>
