<!--
  The status pill after a progress row's title: where you are with the show (Watching, Rewatching since…, Caught up,
  Dropped on…, or the library's Collecting and Collected), opening a menu of the row's show actions. Watched rows
  rewatch and drop, Library rows hide, Dropped rows restore. The rows are the shared visibility controls, so each
  still asks for its date. `onremove` gets a drop, hide or restore as it starts saving, since those take the row off
  the tab.
    <ProgressStatus {row} type="watched" onremove={remove} />
-->
<script lang="ts">
import Caret from '$lib/components/dropdown/Caret.svelte';
import VisibilityControl from '$lib/components/visibility/VisibilityControl.svelte';
import Icon from '$lib/icons/Icon.svelte';
import backward from '$lib/icons/light/backward.svg?raw';
import ban from '$lib/icons/light/ban.svg?raw';
import circleMinus from '$lib/icons/light/circle-minus.svg?raw';
import type { ProgressType } from './progressTypes.ts';
import type { ProgressRow } from './toProgressRow.ts';

interface Props {
  row: ProgressRow;
  type: ProgressType;
  /** A drop, hide or restore started saving, with whether it went through. */
  onremove?: (saved: Promise<boolean>) => void;
}

const { row, type, onremove }: Props = $props();
const id = $props.id();
let menu = $state<HTMLDivElement>();
let expanded = $state(false);

const target = $derived({ type: 'show' as const, id: row.id, title: row.title });
const status = $derived.by(() => {
  if (type === 'dropped') return { tone: 'dropped', text: row.droppedOn ? `Dropped ${row.droppedOn}` : 'Dropped' };
  if (type === 'library') {
    return row.left === 0 ? { tone: 'done', text: 'Collected' } : { tone: 'library', text: 'Collecting' };
  }
  if (row.rewatchingSince) return { tone: 'rewatching', text: `Rewatching since ${row.rewatchingSince}` };
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

{#snippet item(svg: string, name: string, detail: string)}
  <Icon {svg} fixedWidth /><span
  class="text"><span class="name">{name}</span><span class="detail">{detail}</span></span>
{/snippet}

<span class="status-control" style:anchor-name="--progress-status-{id}">
  <button type="button" class={['status', status.tone]} popovertarget="progress-status-{id}" aria-haspopup="menu"
    aria-expanded={expanded} aria-label="{status.text}: show actions for {row.title}">
    <span class="dot" aria-hidden="true"></span>{status.text}<Caret />
  </button>
  <div bind:this={menu} id="progress-status-{id}" class="menu" popover="auto"
    style:position-anchor="--progress-status-{id}" ontoggle={toggle}>
    {#if type === 'dropped'}
      <VisibilityControl {target} action="restore" variant="menu" onsaving={removing}>
        {@render item(circleMinus, 'Restore', 'Back on Watched progress.')}
      </VisibilityControl>
    {:else if type === 'library'}
      <VisibilityControl {target} action="hide" section="progress_collected" variant="menu" onsaving={removing}>
        {@render item(ban, 'Hide', 'Leaves Library progress.')}
      </VisibilityControl>
    {:else}
      <VisibilityControl {target} action="rewatch" variant="menu" onsaving={close}>
        {@render item(
          backward,
          row.rewatchingSince ? 'Start over again' : 'Rewatch',
          `Progress starts over from the first episode. Your ${row.plays.toLocaleString('en-US')} plays stay.`,
        )}
      </VisibilityControl>
      <hr />
      <VisibilityControl {target} action="drop" variant="menu" onsaving={removing}>
        {@render item(circleMinus, 'Drop', 'Leaves Watched progress. Find it under Dropped.')}
      </VisibilityControl>
    {/if}
  </div>
</span>

<style>
.status-control {
  display: inline-flex;
  flex: none;
}

.status {
  --caret-color: currentColor;
  display: inline-flex;
  align-items: center;
  gap: var(--progress-status-gap);
  min-block-size: 0;
  padding: var(--progress-status-padding);
  border: 1px solid var(--color-progress-status-border);
  border-radius: var(--radius-progress-status);
  background: var(--color-progress-status-bg);
  color: var(--color-progress-status-text);
  font: var(--font-weight-headings) var(--font-size-progress-status) / 1 var(--font-headings);
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;

  &:is(:hover, :focus-visible),
  .status-control:has(.menu:popover-open) & {
    border-color: var(--color-text-muted);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: 2px solid var(--color-link);
    outline-offset: 1px;
  }

  &.watching {
    --dot: var(--color-progress-episode-done);
  }

  &.rewatching {
    --dot: var(--color-progress-rewatching-accent);
    border-color: var(--color-progress-rewatching-accent);
    background: var(--color-progress-rewatching-tint);
    color: var(--color-progress-rewatching-text);
  }

  &.library {
    --dot: var(--brand-quaternary);
  }

  &.done {
    --dot: var(--color-text-muted);
  }

  &.dropped {
    --dot: var(--brand-primary);
  }
}

.dot {
  inline-size: var(--progress-status-dot);
  block-size: var(--progress-status-dot);
  border-radius: 50%;
  background: var(--dot);
}

.menu {
  position: fixed;
  position-area: bottom span-right;
  position-try-fallbacks: flip-block, flip-inline;
  inset: auto;
  inline-size: var(--progress-status-menu-width);
  margin: var(--summary-action-menu-gap) 0;
  padding: var(--space-sm-block) 0;
  border: 1px solid var(--color-dropdown-border);
  border-radius: var(--radius-summary-action);
  background: var(--color-box);
  color: var(--color-dropdown-text);
  box-shadow: var(--shadow-dropdown);
  font: var(--font-size-base) / var(--line-height-base) var(--font-body);
  text-align: start;

  & :global(.visibility-trigger.menu) {
    align-items: start;
  }

  & :global(.visibility-trigger.menu > .icon) {
    margin-block-start: var(--progress-status-icon-nudge);
  }

  & hr {
    margin: var(--space-sm-block) 0;
    border: 0;
    border-block-start: 1px solid var(--color-menu-divider);
  }
}

.text {
  display: grid;
}

.name {
  font-family: var(--font-headings);
  font-weight: var(--font-weight-headings);
}

.detail {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  line-height: var(--line-height-progress-row);
  white-space: normal;
}

@media (prefers-reduced-motion: reduce) {
  .status {
    transition: none;
  }
}
</style>
