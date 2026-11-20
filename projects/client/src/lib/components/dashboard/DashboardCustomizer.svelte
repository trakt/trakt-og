<!--
  The dashboard's customize popup, in the header link picker's look: an art header with how many sections show, then
  every movable panel and pinned list as one tile per row. A tile turns its section on or off (bold and washed red with a
  red check when on). A pinned list's tile cuts its name short with an ellipsis and sets its owner and tags (Smart,
  Official List, and the owner's avatar and username on someone else's) on the right, or says it's no longer available; its orange tack after the tile
  unpins it, and while any list is pinned every tile leaves that room, so they all end in line. Drag a row's grip, or focus it and use the
  arrow keys, to move it. The dashboard behind changes as you go and each change is already saved; Reset puts back
  OG's order with every section on, pinned lists first.
-->
<script lang="ts">
import { chipDropIndex } from '#lib/components/header/chipDropIndex.ts';
import Dialog from '#lib/components/dialog/Dialog.svelte';
import DialogArtHeader from '#lib/components/dialog/DialogArtHeader.svelte';
import ListOwnerTag from '#lib/components/lists/ListOwnerTag.svelte';
import ListTag from '#lib/components/lists/ListTag.svelte';
import Tooltip from '#lib/components/tooltip/Tooltip.svelte';
import {
  type DashboardLayout,
  type DashboardPanel,
  type DashboardSection,
  dashboardPrefs,
} from '#lib/dashboard/dashboardPrefs.ts';
import { isPinKey, type ListPin, type PinKey, pinKey } from '#lib/dashboard/listPins.ts';
import thumbtack from '#lib/icons/solid/thumbtack.svg?raw';
import { titleFanart } from '#lib/firstNight/titleFanart.ts';
import Icon from '#lib/icons/Icon.svelte';
import check from '#lib/icons/solid/check.svg?raw';
import grip from '#lib/icons/solid/grip-dots-vertical.svg?raw';
import { moveItem } from '#lib/utils/moveItem.ts';
import { tick } from 'svelte';

interface Props {
  open: boolean;
  layout: DashboardLayout;
  /** Pinned lists the viewer can no longer see. */
  gone?: ReadonlySet<PinKey>;
  onchange: (layout: DashboardLayout) => void;
  onclose?: () => void;
}

let { open = $bindable(), layout, gone = new Set(), onchange, onclose }: Props = $props();
const order = $derived(layout.order);
const id = $props.id();

const TITLE = 'Customize your dashboard';
const TITLES: Record<DashboardPanel, string> = {
  upNext: 'Up Next',
  schedule: 'Upcoming Schedule',
  watchlist: 'Watchlist',
  lastThirtyDays: 'Last 30 Days',
  recentlyWatched: 'Recently Watched',
  watchingNow: 'Watching Now',
  hotInNetwork: 'Hot in Your Network',
  socialFeed: 'Social Feed',
  recommendations: 'Recommendations',
};

const art = $derived(open ? titleFanart('shows', 'mr-robot') : Promise.resolve(undefined));
const shown = $derived(order.filter((section) => dashboardPrefs.isShown(layout, section)).length);
const pinOf = (key: PinKey) => layout.pins.find((pin) => pinKey(pin) === key);
const titleOf = (section: DashboardSection) => (isPinKey(section) ? (pinOf(section)?.name ?? '') : TITLES[section]);

let list = $state<HTMLElement>();
let body = $state<HTMLElement>();
// The dragged row's copy under the pointer, placed inside the body; its own slot dims and moves as it passes others.
let ghost = $state<{ panel: DashboardSection; x: number; y: number; width: number } | null>(null);
let dragging = $state<DashboardSection | null>(null);
let announcement = $state('');

const gripOf = (panel: DashboardSection) =>
  [...(list?.querySelectorAll<HTMLElement>('[data-panel]') ?? [])]
    .find((row) => row.dataset.panel === panel)
    ?.querySelector<HTMLElement>('.grip');

function toggle(section: DashboardSection) {
  if (!isPinKey(section)) {
    onchange({ ...layout, hidden: { ...layout.hidden, [section]: !layout.hidden[section] } });
    return;
  }
  const pins = layout.pins.map((pin) => (pinKey(pin) === section ? { ...pin, hidden: !pin.hidden } : pin));
  onchange({ ...layout, pins });
}

function unpin(key: PinKey) {
  announcement = `${titleOf(key)} unpinned`;
  onchange(dashboardPrefs.unpin(layout, key));
}

async function move(panel: DashboardSection, to: number) {
  const from = order.indexOf(panel);
  if (from === to) return;
  onchange({ ...layout, order: moveItem(order, from, to) });
  announcement = `${titleOf(panel)}, ${to + 1} of ${order.length}`;
  // Moving the row's element drops its focus, so give it back.
  if (dragging) return;
  await tick();
  gripOf(panel)?.focus();
}

function nudge(event: KeyboardEvent, panel: DashboardSection) {
  const step = { ArrowUp: -1, ArrowDown: 1 }[event.key];
  if (!step) return;
  event.preventDefault();
  const to = order.indexOf(panel) + step;
  if (to >= 0 && to < order.length) move(panel, to);
}

// The copy follows the pointer, not the grip: moving a row moves its element, which drops any pointer capture.
function drag(event: PointerEvent, panel: DashboardSection) {
  const row = event.currentTarget instanceof Element ? event.currentTarget.closest('[data-panel]') : null;
  if (event.button !== 0 || !row) return;
  event.preventDefault();
  dragging = panel;
  const pointer = event.pointerId;
  const grabbed = row.getBoundingClientRect();
  const offsetX = event.clientX - grabbed.left;
  const offsetY = event.clientY - grabbed.top;
  const follow = ({ clientX, clientY }: PointerEvent) => {
    const box = body?.getBoundingClientRect();
    // The rows scroll inside the body, so the copy's place counts what's scrolled past.
    const y = clientY - (box?.top ?? 0) - offsetY + (body?.scrollTop ?? 0);
    if (box) ghost = { panel, x: clientX - box.left - offsetX, y, width: grabbed.width };
  };
  follow(event);

  const over = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointer) return;
    follow(moveEvent);
    const boxes = [...(list?.querySelectorAll('[data-panel]') ?? [])].map((row) => row.getBoundingClientRect());
    const to = chipDropIndex({ boxes, from: order.indexOf(panel), x: moveEvent.clientX, y: moveEvent.clientY });
    if (to !== null) move(panel, to);
  };
  const drop = (upEvent: PointerEvent) => {
    if (upEvent.pointerId !== pointer) return;
    dragging = null;
    ghost = null;
    window.removeEventListener('pointermove', over);
    window.removeEventListener('pointerup', drop);
    window.removeEventListener('pointercancel', drop);
  };
  window.addEventListener('pointermove', over);
  window.addEventListener('pointerup', drop);
  window.addEventListener('pointercancel', drop);
}

function reset() {
  const { order: defaults, hidden } = dashboardPrefs.layoutOf(dashboardPrefs.defaults);
  const pins = layout.pins.map(({ hidden: _, ...pin }) => pin);
  onchange(dashboardPrefs.arrange({ order: defaults, hidden, pins }));
  announcement = "Back to OG's order, every section on";
}

function done() {
  open = false;
  onclose?.();
}
</script>

{#snippet tile(section: DashboardSection)}
  {#if isPinKey(section)}
    {@const pin = pinOf(section)}
    <span class="title pinned">{pin?.name}</span>
    {#if pin}{@render about(pin, gone.has(section))}{/if}
  {:else}
    <span class="title">{TITLES[section]}</span>
  {/if}
  <span class="mark"><Icon svg={check} /></span>
{/snippet}

{#snippet about(pin: ListPin, missing: boolean)}
  <span class="about">
    {#if missing}
      <span class="missing">No longer available</span>
    {:else}
      {#if pin.kind === 'smart'}<ListTag tag="Smart" />{:else if pin.kind === 'official'}<ListTag tag="Official List" />{/if}
      {#if pin.by}<ListOwnerTag username={pin.by} avatar={pin.avatar} />{/if}
    {/if}
  </span>
{/snippet}

{#snippet unpinButton(key: PinKey)}
  <Tooltip text="Unpin from dashboard" placement="right">
    {#snippet trigger(tooltip)}
      <button type="button" class="unpin" aria-label="Unpin {titleOf(key)}" {...tooltip} onclick={() => unpin(key)}
        ><Icon svg={thumbtack} /></button>
    {/snippet}
  </Tooltip>
{/snippet}

<Dialog bind:open title={TITLE} size="notes" variant="art" lightDismiss contained {onclose}>
  {#snippet header(headerId)}
    {@const tags = [{ text: `${shown} of ${order.length} sections` }]}
    {#await art}
      <DialogArtHeader id={headerId} title={TITLE} {tags} loading />
    {:then fanart}
      <DialogArtHeader id={headerId} title={TITLE} {fanart} {tags} />
    {/await}
  {/snippet}
  <!-- Focus starts on the popup itself, not on its first grip. -->
  <!-- svelte-ignore a11y_autofocus -->
  <div class="body" tabindex="-1" autofocus bind:this={body}>
    <p id="{id}-hint" class="visually-hidden">Arrow keys move it.</p>
    <p class="visually-hidden" aria-live="polite">{announcement}</p>
    <ol class="rows" aria-label="Dashboard sections" bind:this={list}>
      {#each order as panel (panel)}
        <li class={['row', { dragging: dragging === panel }]} data-panel={panel}>
          <button type="button" class="grip" aria-label="Move {titleOf(panel)}" aria-describedby="{id}-hint"
            onpointerdown={(event) => drag(event, panel)} onkeydown={(event) => nudge(event, panel)}>
            <Icon svg={grip} />
          </button>
          <button type="button" class="choice" aria-pressed={dashboardPrefs.isShown(layout, panel)}
            onclick={() => toggle(panel)}>
            {@render tile(panel)}
          </button>
          {#if isPinKey(panel)}{@render unpinButton(panel)}{:else if layout.pins.length > 0}<span class="unpin-room"></span>{/if}
        </li>
      {/each}
    </ol>
    {#if ghost}
      <div class="row ghost" style:translate="{ghost.x}px {ghost.y}px" style:inline-size="{ghost.width}px"
        aria-hidden="true">
        <span class="grip"><Icon svg={grip} /></span>
        <span class="choice" aria-pressed={dashboardPrefs.isShown(layout, ghost.panel)}>{@render tile(ghost.panel)}</span>
        {#if isPinKey(ghost.panel)}<span class="unpin"><Icon svg={thumbtack} /></span>{:else if layout.pins.length > 0}<span
            class="unpin-room"></span>{/if}
      </div>
    {/if}
  </div>
  <footer class="footer">
    <span class="summary">Saved to this browser.</span>
    <button type="button" class="reset" onclick={reset}>Reset</button>
    <button type="button" class="done" onclick={done}>Done</button>
  </footer>
</Dialog>

<style>
/* Taller than the window, only the rows scroll; the art header and the footer stay put. */
.body {
  position: relative;
  min-block-size: 0;
  overflow-y: auto;
  outline: none;
  /* The grips' dots line up with the header's title and the footer's text. */
  padding: var(--dialog-art-body-top) var(--dialog-art-inline);
}

.rows {
  display: grid;
  gap: var(--dashboard-customizer-row-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  gap: var(--space-xs-inline);

  &.dragging {
    opacity: var(--opacity-header-dragging);
  }

  /* Lifted off the list, following the pointer. */
  &.ghost {
    position: absolute;
    inset: 0 auto auto 0;
    z-index: 1;
    pointer-events: none;

    & .choice {
      background-color: var(--color-dialog-art-footer-bg);
      box-shadow: var(--shadow-dashboard-customizer-lifted);
    }
  }
}

.grip {
  display: grid;
  flex: none;
  place-items: center start;
  inline-size: var(--dashboard-customizer-grip-inline);
  block-size: var(--dashboard-customizer-grip);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--color-dashboard-customizer-grip);
  font-size: var(--font-size-dashboard-customizer-grip);
  cursor: grab;
  touch-action: none;

  &:hover {
    color: var(--color-taste-genre-on-text);
  }

  .dragging & {
    cursor: grabbing;
  }
}

/* The link picker's tiles: gray until on, then bold and washed red with a red check at the end. */
.choice {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm-inline);
  min-inline-size: 0;
  min-block-size: 0;
  padding: var(--header-picker-row-padding) var(--space-sm-inline);
  border: 1px solid var(--color-taste-genre-line);
  border-radius: var(--radius-service-modal);
  background: var(--color-taste-genre-bg);
  color: var(--color-taste-genre-text);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;

  &:hover {
    border-color: var(--color-taste-genre-hover-line);
    color: var(--color-taste-genre-on-text);
  }

  &[aria-pressed='true'] {
    border-color: var(--brand-primary);
    background: var(--color-taste-genre-on-bg);
    color: var(--color-taste-genre-on-text);
  }
}

.title {
  font-size: var(--font-size-header-picker-choice);

  [aria-pressed='true'] & {
    font-weight: var(--font-weight-headings-heavy);
  }
}

/* A pinned list's name gives way first, cut short, to its owner and tags on the right. */
.pinned {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.about {
  display: flex;
  flex: none;
  align-items: center;
  white-space: nowrap;
  gap: var(--list-title-pill-gap);
  color: var(--color-dialog-art-hint);
  font-size: var(--font-size-dialog-art-hint);
  font-weight: normal;
}

.missing {
  color: var(--color-list-pin);
}

/* The pinned tack, which unpins, as narrow as the grip across the row; the other rows keep its room while any list is
   pinned. */
.unpin,
.unpin-room {
  flex: none;
  inline-size: var(--dashboard-customizer-grip-inline);
}

.unpin {
  display: grid;
  place-items: center end;
  block-size: var(--dashboard-customizer-grip);
  min-block-size: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-list-pin);
  font-size: var(--font-size-dashboard-customizer-grip);
  cursor: pointer;

  &:is(:hover, :focus-visible) {
    color: var(--color-list-pin-on-hover);
  }
}

/* The check keeps its room when off, so nothing shifts as a tile turns on. */
.mark {
  flex: none;
  color: var(--brand-primary);
  font-size: var(--font-size-header-picker-check);
  visibility: hidden;

  [aria-pressed='true'] > & {
    visibility: visible;
  }
}

.footer {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--dialog-art-footer-gap);
  padding: var(--dialog-art-footer-padding);
  border-block-start: 1px solid var(--color-dialog-art-border);
  background-color: var(--color-dialog-art-footer-bg);
}

/* The art form popups' footer: a hint, an outlined button, then the red one. */
.summary {
  flex: 1;
  color: var(--color-dialog-art-hint);
  font-size: var(--font-size-dialog-art-hint);
}

.reset,
.done {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-block-size: var(--dialog-art-button-height);
  padding: var(--dialog-art-button-padding);
  border: 1px solid var(--color-dialog-art-secondary-border);
  border-radius: var(--radius-control);
  background: var(--color-dialog-art-secondary-bg);
  color: var(--color-control-text);
  font-family: var(--font-headings);
  font-size: var(--font-size-dialog-art-button);
  font-weight: var(--font-weight-headings-heavy);
  line-height: 1;
  cursor: pointer;

  &:hover {
    border-color: var(--color-dialog-art-secondary-border-hover);
    background-color: var(--color-dialog-art-secondary-hover);
  }
}

.done {
  border-color: var(--brand-primary);
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);

  &:hover {
    border-color: var(--brand-primary-darken);
    background-color: var(--brand-primary-darken);
  }
}

@media (prefers-reduced-motion: reduce) {
  .choice {
    transition: none;
  }
}
</style>
