<!--
  The header's main nav: the member's links in bar order, as loose pills with the current page's in solid red. Links
  that don't fit fold, last first, into a More menu at the end, so the bar never wraps; the server draws them all and
  the bar clips the overflow until the browser measures it.
  While editing, each link is a chip: drag its grip, or focus the grip and use the arrow keys, to move it, and the
  trash can removes it. Add Link at the end opens the picker. The chips wrap onto more rows when they need them.
  Signed in, a pencil after the links opens edit mode. It shows when the mouse rests on the links for a moment, or
  when the keyboard reaches it, so the bar looks the same the rest of the time.
-->
<script lang="ts">
import { page } from '$app/state';
import Icon from '$lib/icons/Icon.svelte';
import trash from '$lib/icons/regular/trash-can.svg?raw';
import angleDown from '$lib/icons/solid/angle-down.svg?raw';
import grip from '$lib/icons/solid/grip-dots-vertical.svg?raw';
import pen from '$lib/icons/solid/pen.svg?raw';
import plus from '$lib/icons/solid/plus.svg?raw';
import { moveItem } from '$lib/utils/moveItem';
import { tick } from 'svelte';
import { chipDropIndex } from './chipDropIndex.ts';
import { currentHeaderLink } from './currentHeaderLink.ts';
import type { HeaderLink } from './HeaderLink.ts';
import HeaderLinkPicker from './HeaderLinkPicker.svelte';
import HeaderMenu from './HeaderMenu.svelte';

interface Props {
  /** The bar's links, in order. */
  links: readonly HeaderLink[];
  /** Every link the picker offers. */
  choices: readonly HeaderLink[];
  editing: boolean;
  /** The bar's next link ids, in order. */
  onchange: (ids: string[]) => void;
  /** Opens edit mode from the pencil. Without it (signed out) there's no pencil. */
  oncustomize?: () => void;
  /** The member's first name, over their own pages in the picker. */
  name?: string;
}

const { links, choices, editing, onchange, oncustomize, name = 'Your Pages' }: Props = $props();
const id = $props.id();

const current = $derived(currentHeaderLink(links, page.url.pathname));
const ids = $derived(links.map((link) => link.id));

// How many links fit on the bar's one row. Every link fits until the browser measures.
let fit = $state(Number.POSITIVE_INFINITY);
const folded = $derived(links.slice(fit));
let nav = $state<HTMLElement | null>(null);
// The bar's width, so a resize measures again even when every link already fit.
let width = $state(0);

// When the bar's width changes, start over with every link on it. Write in the next frame (performance.md).
const refit = (element: HTMLElement) => {
  let frame = 0;
  const observer = new ResizeObserver(([entry]) => {
    const next = entry?.contentRect.width ?? 0;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      fit = Number.POSITIVE_INFINITY;
      width = next;
    });
  });
  observer.observe(element);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
};

// The clipped row lets what doesn't fit wrap out of sight. With every link on it, the links left on the first row are
// the ones that fit. Then More joins that row, with the folded links after it, so fold one more until More is on it.
$effect(() => {
  const count = links.length;
  if (!nav || fit === 0 || width === 0) return;
  const items = [...nav.children].filter((child) => child instanceof HTMLElement);
  const top = items.at(0)?.offsetTop;
  const more = items.find((item) => item.classList.contains('more'));
  if (more) {
    if (more.offsetTop !== top) fit = Math.min(fit, count) - 1;
    return;
  }
  const shown = items.filter((item) => item.offsetTop === top).length;
  if (shown < count) fit = shown;
});

// How long the mouse rests on the links before the pencil shows, so passing over them on the way to one doesn't.
const REST_MS = 500;
let resting = $state(false);

const restOn = (row: HTMLElement) => {
  let timer = 0;
  const enter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(timer);
    timer = window.setTimeout(() => (resting = true), REST_MS);
  };
  const leave = () => {
    clearTimeout(timer);
    resting = false;
  };
  row.addEventListener('pointerenter', enter);
  row.addEventListener('pointerleave', leave);
  return () => {
    // Edit mode swaps the row out under the pointer, which never leaves it; the pencil waits for the next rest.
    leave();
    row.removeEventListener('pointerenter', enter);
    row.removeEventListener('pointerleave', leave);
  };
};

let picking = $state(false);
let chips = $state<HTMLElement>();
let editor = $state<HTMLElement>();
// The dragged chip's copy under the pointer, placed inside the editor; its own slot dims and moves as it passes others.
let ghost = $state<{ title: string; x: number; y: number } | null>(null);
let dragging = $state<string | null>(null);
let announcement = $state('');

const gripOf = (linkId: string) =>
  [...(chips?.querySelectorAll<HTMLElement>('[data-link]') ?? [])]
    .find((chip) => chip.dataset.link === linkId)
    ?.querySelector<HTMLElement>('.grip');

async function move(linkId: string, to: number) {
  const from = ids.indexOf(linkId);
  if (from === to) return;
  onchange(moveItem(ids, from, to));
  announcement = `${links.at(from)?.title}, ${to + 1} of ${ids.length}`;
  // Moving the chip's element drops its focus, so give it back.
  if (dragging) return;
  await tick();
  gripOf(linkId)?.focus();
}

function nudge(event: KeyboardEvent, linkId: string) {
  const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
  if (!step) return;
  event.preventDefault();
  const to = ids.indexOf(linkId) + step;
  if (to >= 0 && to < ids.length) move(linkId, to);
}

// The window follows the pointer, not the grip: moving a chip moves its element, which drops any pointer capture.
function drag(event: PointerEvent, linkId: string) {
  const chip = event.currentTarget instanceof Element ? event.currentTarget.closest('[data-link]') : null;
  if (event.button !== 0 || !chip) return;
  event.preventDefault();
  dragging = linkId;
  const pointer = event.pointerId;
  const title = links.find((link) => link.id === linkId)?.title ?? '';
  const grabbed = chip.getBoundingClientRect();
  const offsetX = event.clientX - grabbed.left;
  const offsetY = event.clientY - grabbed.top;
  const follow = ({ clientX, clientY }: PointerEvent) => {
    const box = editor?.getBoundingClientRect();
    if (box) ghost = { title, x: clientX - box.left - offsetX, y: clientY - box.top - offsetY };
  };
  follow(event);

  const over = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointer) return;
    follow(moveEvent);
    const boxes = [...(chips?.querySelectorAll('[data-link]') ?? [])].map((chip) => chip.getBoundingClientRect());
    const to = chipDropIndex({ boxes, from: ids.indexOf(linkId), x: moveEvent.clientX, y: moveEvent.clientY });
    if (to !== null) move(linkId, to);
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

async function remove(linkId: string) {
  const index = ids.indexOf(linkId);
  const next = ids.filter((other) => other !== linkId);
  onchange(next);
  announcement = `Removed ${links.at(index)?.title}`;
  await tick();
  const after = next.at(Math.min(index, next.length - 1));
  (after ? gripOf(after) : chips?.parentElement?.querySelector<HTMLElement>('.add'))?.focus();
}
</script>

<!-- Links point at OG routes og hasn't built yet, and resolve() only takes routes that exist. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if editing}
  <div class="editor" bind:this={editor}>
  <ol class="chips" aria-label="Header links" bind:this={chips}>
    {#each links as link (link.id)}
      <li class={['chip', { current: link.id === current, dragging: dragging === link.id }]} data-link={link.id}>
        <button type="button" class="grip" aria-label="Move {link.title}" aria-describedby="{id}-hint"
          onpointerdown={(event) => drag(event, link.id)} onkeydown={(event) => nudge(event, link.id)}>
          <Icon svg={grip} />
        </button>
        {link.title}
        <button type="button" class="remove" aria-label="Remove {link.title}" onclick={() => remove(link.id)}>
          <Icon svg={trash} />
        </button>
      </li>
    {/each}
  </ol>
  <button type="button" class="add" onclick={() => (picking = true)}><Icon svg={plus} /> Add Link</button>
  {#if ghost}
    <div class="chip ghost" style:translate="{ghost.x}px {ghost.y}px" aria-hidden="true">
      <span class="grip"><Icon svg={grip} /></span>{ghost.title}<span class="remove"><Icon svg={trash} /></span>
    </div>
  {/if}
  </div>
  <HeaderLinkPicker bind:open={picking} {links} {choices} {onchange} {name} />
  <p id="{id}-hint" class="visually-hidden">Arrow keys move it.</p>
  <p class="visually-hidden" aria-live="polite">{announcement}</p>
{:else}
  <div class={['row', { resting }]} {@attach restOn}>
  <nav class="links" aria-label="Main" bind:this={nav} {@attach refit}>
    {#each links as link, index (link.id)}
      <a href={link.href} aria-current={link.id === current ? 'true' : undefined} class={{ folded: index >= fit }}
        >{link.title}</a>
    {/each}
    {#if folded.length > 0}
      <div class="more">
        <HeaderMenu>
          {#snippet trigger()}More <Icon svg={angleDown} />{/snippet}
          <ul>
            {#each folded as link (link.id)}
              <li><a href={link.href} aria-current={link.id === current ? 'page' : undefined}>{link.title}</a></li>
            {/each}
          </ul>
        </HeaderMenu>
      </div>
    {/if}
  </nav>
  {#if oncustomize}
    <button type="button" class="customize" aria-label="Customize header" title="Customize header"
      onclick={oncustomize}><Icon svg={pen} /></button>
  {/if}
  </div>
{/if}

<style>
/* Loose pills. Hover gives a soft glass pill, and the current page is solid red. */
.links > a,
.more :global(.trigger),
.add,
.chip {
  display: flex;
  align-items: center;
  gap: var(--space-xs-inline);
  block-size: var(--header-pill-height);
  padding-inline: var(--space-header-pill-inline);
  border-radius: var(--radius-header-pill);
  color: var(--color-header-muted);
  font-size: var(--font-size-header-link);
  text-decoration: none;
  text-shadow: none;
  white-space: nowrap;
  transition: background-color 0.2s, color 0.2s;
}

/* The current page's red pill stays red under the pointer. */
.links > a:not([aria-current]),
.more :global(.trigger) {
  &:hover {
    background-color: var(--color-header-pill);
    color: var(--color-header-text);
  }
}

.links > a[aria-current] {
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-header-current);
}

/* One row, clipped: a link that doesn't fit wraps a whole bar's height down, out of sight, and More takes it. The
   room around the row keeps focus rings whole, and the room under it keeps More's bridge to its menu (HeaderMenu),
   so the pointer crossing the gap doesn't close it. */
.links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--header-height) var(--gap-header-links);
  min-inline-size: 0;
  block-size: calc(var(--header-pill-height) + var(--header-links-focus-room) + var(--header-menu-gap));
  margin: calc(-1 * var(--header-links-focus-room));
  margin-block-end: calc(-1 * var(--header-menu-gap));
  padding: var(--header-links-focus-room);
  padding-block-end: var(--header-menu-gap);
  overflow: hidden;
}

/* After More, out of sight on the row below. */
.folded {
  order: 1;
  visibility: hidden;
}

/* The links and the pencil after them, which sits out of sight until the mouse rests on the row. */
.row {
  display: flex;
  align-items: center;
  gap: var(--gap-header-links);
  min-inline-size: 0;
}

.customize {
  display: grid;
  flex: none;
  place-items: center;
  inline-size: var(--header-customize-size);
  block-size: var(--header-customize-size);
  min-block-size: 0;
  margin-inline-start: var(--space-xs-inline);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  box-shadow: inset 0 0 0 1px var(--color-header-chip-edge);
  color: var(--color-header-muted);
  font-size: var(--font-size-header-chip-icon);
  opacity: 0;
  scale: 0.85;
  pointer-events: none;
  transition: opacity 0.2s, scale 0.2s, background-color 0.2s, color 0.2s;

  .row:is(.resting, :focus-within) & {
    opacity: 1;
    scale: 1;
    pointer-events: auto;
  }

  &:is(:hover, :focus-visible) {
    background-color: var(--color-header-pill);
    color: var(--color-header-text);
  }
}

/* The chips and Add Link wrap together, so Add Link follows the last chip. */
.editor {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-header-editing);
  min-inline-size: 0;
}

.chips {
  display: contents;
  list-style: none;
}

.chip {
  gap: var(--space-header-chip);
  padding-inline: var(--space-header-chip);
  /* The grip's narrower than the trash can's button; the start takes the difference, so only the title moves in. */
  padding-inline-start: calc(var(--space-header-chip) + (var(--header-chip-button) - var(--header-chip-grip)) / 2);
  background-color: var(--color-header-chip-bg);
  box-shadow: inset 0 0 0 1px var(--color-header-chip-edge);
  color: var(--color-header-text);

  &.current {
    background-color: var(--color-header-chip-current);
  }

  &.dragging {
    opacity: var(--opacity-header-dragging);
  }

  /* Lifted off the bar, following the pointer. */
  &.ghost {
    position: absolute;
    inset: 0 auto auto 0;
    z-index: 1;
    background-color: var(--color-header-chip-lifted);
    box-shadow: inset 0 0 0 1px var(--color-header-chip-edge), var(--shadow-header-chip-lifted);
    pointer-events: none;
  }
}

.grip,
.remove {
  display: grid;
  place-items: center;
  inline-size: var(--header-chip-button);
  block-size: var(--header-chip-button);
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--color-header-muted);
  font-size: var(--font-size-header-chip-icon);
}

.grip {
  inline-size: var(--header-chip-grip);
  cursor: grab;
  touch-action: none;

  .dragging & {
    cursor: grabbing;
  }
}

.remove:is(:hover, :focus-visible) {
  background-color: var(--brand-primary);
  color: var(--color-text-inverse);
}

.add {
  flex: none;
  min-block-size: 0;
  border: 0;
  font: inherit;
  cursor: pointer;
  background-color: var(--color-header-add);
  box-shadow: inset 0 0 0 1px var(--color-header-chip-edge);
  color: var(--color-header-text);

  &:hover {
    background-color: var(--color-header-add-hover);
  }
}

@media (prefers-reduced-motion: reduce) {
  .links > a,
  .chip,
  .add,
  .customize,
  .more :global(.trigger) {
    transition: none;
  }
}

/* Tablets: tighter link pills, so more links fit before they fold into More. */
@media (width <= 1200px) {
  .links > a,
  .more :global(.trigger) {
    padding-inline: var(--space-sm-inline);
  }
}
</style>
